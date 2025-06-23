import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    patientCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientComment', required: true },
    commentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    commentFor: { type: mongoose.Schema.Types.Mixed, required: true }, // ObjectId (User) or 'admin'
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    read: {
        type: Boolean,
        default: false,
      },
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification; 