import express from 'express';
import { handleTwilioWebhook, handleN8NWebhook } from '../controllers/WebhookController';

const router = express.Router();

router.post('/twilio', handleTwilioWebhook);
router.post('/n8n', handleN8NWebhook);

export default router;
