import { Request, Response } from 'express';
import { Marquee } from '../models/Marquee';

export const getMarquees = async (req: Request, res: Response) => {
  try {
    const query = req.query.all === 'true' ? {} : { active: true };
    const marquees = await Marquee.find(query).sort({ priority: -1, createdAt: -1 });
    res.json(marquees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marquees' });
  }
};

export const createMarquee = async (req: Request, res: Response) => {
  try {
    const marquee = new Marquee(req.body);
    await marquee.save();
    res.status(201).json(marquee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create marquee' });
  }
};

export const updateMarquee = async (req: Request, res: Response) => {
  try {
    const marquee = await Marquee.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(marquee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update marquee' });
  }
};

export const deleteMarquee = async (req: Request, res: Response) => {
  try {
    await Marquee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Marquee deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete marquee' });
  }
};
