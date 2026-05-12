import { Request, Response } from 'express';
import { Photo } from '../models/Photo.ts';

export const uploadPhoto = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photo = new Photo({
      url: req.file.path,
      publicId: req.file.filename,
      uploadedBy: req.user?.id
    });

    await photo.save();

    res.json({
      success: true,
      url: photo.url,
      id: photo._id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPhotos = async (req: Request, res: Response) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
