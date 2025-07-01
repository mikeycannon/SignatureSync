import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../prisma";
import { authenticateToken, validateTenantAccess } from "../middleware/auth";
import { validate, uploadSchemas } from "../middleware/validation";
import { asyncHandler, successResponse, ApiError, HTTP_STATUS } from "../middleware/error";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const assetsDir = path.join(uploadsDir, 'assets');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directories:', error);
  }
}

// Initialize directories
ensureDirectories();

/**
 * Multer configuration for file uploads
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories();
    cb(null, assetsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, svg, webp)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

/**
 * Get file size in a human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * @route POST /api/upload/single
 * @desc Upload a single image file
 * @access Private
 * @form {File} file - Image file to upload
 * @query {string} type - Asset type (logo, image, avatar)
 * @query {string} description - File description (optional)
 */
router.post(
  "/single",
  authenticateToken,
  validateTenantAccess,
  validate({ 
    query: uploadSchemas.query.keys({
      description: uploadSchemas.query.extract('type').optional()
    })
  }),
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "No file uploaded",
        "FILE_REQUIRED"
      );
    }

    const { type = 'image', description } = req.query;
    const file = req.file;

    try {
      // Get file stats
      const stats = await fs.stat(file.path);
      
      // Generate public URL
      const fileUrl = `/uploads/assets/${file.filename}`;

      // Save asset metadata to database
      const asset = await prisma.asset.create({
        data: {
          name: file.originalname,
          filename: file.filename,
          mime_type: file.mimetype,
          size: file.size,
          url: fileUrl,
          type: type as string,
          description: description as string || null,
          tenant_id: req.tenant!.id,
          uploaded_by: req.user!.userId
        },
        include: {
          uploaded_by_user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      // Log activity
      await prisma.processingLog.create({
        data: {
          tenant_id: req.tenant!.id,
          user_id: req.user!.userId,
          email_id: `file_uploaded_${asset.id}`,
          status: 'success'
        }
      });

      successResponse(
        res,
        {
          id: asset.id,
          name: asset.name,
          filename: asset.filename,
          original_name: file.originalname,
          mime_type: asset.mime_type,
          size: asset.size,
          formatted_size: formatFileSize(asset.size),
          url: asset.url,
          type: asset.type,
          description: asset.description,
          uploaded_at: asset.created_at,
          uploaded_by: asset.uploaded_by_user
        },
        "File uploaded successfully",
        HTTP_STATUS.CREATED
      );

    } catch (error) {
      // Clean up file if database save fails
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up file after database error:', unlinkError);
      }
      throw error;
    }
  })
);

/**
 * @route POST /api/upload/multiple
 * @desc Upload multiple image files
 * @access Private
 * @form {File[]} files - Image files to upload (max 5)
 * @query {string} type - Asset type (logo, image, avatar)
 */
router.post(
  "/multiple",
  authenticateToken,
  validateTenantAccess,
  validate({ query: uploadSchemas.query }),
  upload.array('files', 5),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "No files uploaded",
        "FILES_REQUIRED"
      );
    }

    const { type = 'image' } = req.query;
    const uploadedAssets = [];
    const failedUploads = [];

    for (const file of files) {
      try {
        // Generate public URL
        const fileUrl = `/uploads/assets/${file.filename}`;

        // Save asset metadata to database
        const asset = await prisma.asset.create({
          data: {
            name: file.originalname,
            filename: file.filename,
            mime_type: file.mimetype,
            size: file.size,
            url: fileUrl,
            type: type as string,
            tenant_id: req.tenant!.id,
            uploaded_by: req.user!.userId
          }
        });

        uploadedAssets.push({
          id: asset.id,
          name: asset.name,
          filename: asset.filename,
          original_name: file.originalname,
          mime_type: asset.mime_type,
          size: asset.size,
          formatted_size: formatFileSize(asset.size),
          url: asset.url,
          type: asset.type,
          uploaded_at: asset.created_at
        });

      } catch (error) {
        failedUploads.push({
          filename: file.originalname,
          error: 'Database save failed'
        });

        // Clean up file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up file:', unlinkError);
        }
      }
    }

    // Log activity
    if (uploadedAssets.length > 0) {
      await prisma.processingLog.create({
        data: {
          tenant_id: req.tenant!.id,
          user_id: req.user!.userId,
          email_id: `bulk_upload_${uploadedAssets.length}`,
          status: 'success'
        }
      });
    }

    successResponse(
      res,
      {
        uploaded: uploadedAssets,
        failed: failedUploads,
        total_uploaded: uploadedAssets.length,
        total_failed: failedUploads.length
      },
      `${uploadedAssets.length} files uploaded successfully`,
      HTTP_STATUS.CREATED
    );
  })
);

/**
 * @route GET /api/upload/assets
 * @desc Get all uploaded assets for the tenant
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} type - Filter by asset type
 * @query {string} q - Search query (searches name and description)
 */
router.get(
  "/assets",
  authenticateToken,
  validateTenantAccess,
  validate({ 
    query: uploadSchemas.query.keys({
      page: uploadSchemas.query.extract('page').optional(),
      limit: uploadSchemas.query.extract('limit').optional(),
      q: uploadSchemas.query.extract('q').optional()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      q 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build search conditions
    const where: any = {
      tenant_id: req.tenant!.id
    };

    if (type) {
      where.type = type;
    }

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.asset.count({ where });

    // Get assets with uploader info
    const assets = await prisma.asset.findMany({
      where,
      include: {
        uploaded_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: Number(limit)
    });

    // Transform response
    const assetsWithDetails = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      filename: asset.filename,
      mime_type: asset.mime_type,
      size: asset.size,
      formatted_size: formatFileSize(asset.size),
      url: asset.url,
      type: asset.type,
      description: asset.description,
      uploaded_at: asset.created_at,
      uploaded_by: asset.uploaded_by_user ? {
        ...asset.uploaded_by_user,
        full_name: `${asset.uploaded_by_user.first_name} ${asset.uploaded_by_user.last_name}`
      } : null
    }));

    successResponse(
      res,
      {
        assets: assetsWithDetails,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          total_pages: Math.ceil(total / Number(limit))
        }
      },
      "Assets retrieved successfully"
    );
  })
);

/**
 * @route GET /api/upload/assets/:id
 * @desc Get specific asset details
 * @access Private
 * @param {number} id - Asset ID
 */
router.get(
  "/assets/:id",
  authenticateToken,
  validateTenantAccess,
  validate({ params: uploadSchemas.query.extract('id') }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      },
      include: {
        uploaded_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    if (!asset) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Asset not found",
        "ASSET_NOT_FOUND"
      );
    }

    // Check if file still exists
    const filePath = path.join(assetsDir, asset.filename);
    let fileExists = false;
    try {
      await fs.access(filePath);
      fileExists = true;
    } catch (error) {
      fileExists = false;
    }

    successResponse(
      res,
      {
        id: asset.id,
        name: asset.name,
        filename: asset.filename,
        mime_type: asset.mime_type,
        size: asset.size,
        formatted_size: formatFileSize(asset.size),
        url: asset.url,
        type: asset.type,
        description: asset.description,
        file_exists: fileExists,
        uploaded_at: asset.created_at,
        uploaded_by: asset.uploaded_by_user ? {
          ...asset.uploaded_by_user,
          full_name: `${asset.uploaded_by_user.first_name} ${asset.uploaded_by_user.last_name}`
        } : null
      },
      "Asset details retrieved successfully"
    );
  })
);

/**
 * @route DELETE /api/upload/assets/:id
 * @desc Delete an uploaded asset
 * @access Private (Admin or uploader)
 * @param {number} id - Asset ID
 */
router.delete(
  "/assets/:id",
  authenticateToken,
  validateTenantAccess,
  validate({ params: uploadSchemas.query.extract('id') }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'admin';

    const asset = await prisma.asset.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      }
    });

    if (!asset) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Asset not found",
        "ASSET_NOT_FOUND"
      );
    }

    // Check permissions (admin or uploader)
    if (!isAdmin && asset.uploaded_by !== req.user!.userId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "You can only delete assets you uploaded",
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    // Delete file from filesystem
    const filePath = path.join(assetsDir, asset.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('File not found on filesystem:', filePath);
    }

    // Delete from database
    await prisma.asset.delete({
      where: {
        id: Number(id)
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `asset_deleted_${id}`,
        status: 'success'
      }
    });

    successResponse(
      res,
      null,
      "Asset deleted successfully",
      HTTP_STATUS.NO_CONTENT
    );
  })
);

/**
 * @route GET /api/upload/stats
 * @desc Get upload statistics for the tenant
 * @access Private
 */
router.get(
  "/stats",
  authenticateToken,
  validateTenantAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const [totalAssets, totalSize, assetsByType] = await Promise.all([
      // Total number of assets
      prisma.asset.count({
        where: { tenant_id: req.tenant!.id }
      }),

      // Total size of all assets
      prisma.asset.aggregate({
        where: { tenant_id: req.tenant!.id },
        _sum: { size: true }
      }),

      // Assets grouped by type
      prisma.asset.groupBy({
        by: ['type'],
        where: { tenant_id: req.tenant!.id },
        _count: { type: true },
        _sum: { size: true }
      })
    ]);

    const totalSizeBytes = totalSize._sum.size || 0;

    successResponse(
      res,
      {
        total_assets: totalAssets,
        total_size: totalSizeBytes,
        formatted_total_size: formatFileSize(totalSizeBytes),
        assets_by_type: assetsByType.map(group => ({
          type: group.type,
          count: group._count.type,
          size: group._sum.size || 0,
          formatted_size: formatFileSize(group._sum.size || 0)
        }))
      },
      "Upload statistics retrieved successfully"
    );
  })
);

export default router;