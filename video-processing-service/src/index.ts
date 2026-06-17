import express from 'express';
import ffmpeg from 'fluent-ffmpeg';

const app = express();
app.use(express.json());

app.post('/process-video', (req, res) => {
  const inputFilePath = req.body.inputFilePath;
  const outputFilePath = req.body.outputFilePath;

  if (!inputFilePath || !outputFilePath) {
    return res.status(400).json({ error: 'Input and output file paths are required.' });
  }

  ffmpeg(inputFilePath)
  .outputOptions('-vf', 'scale=-1:360')
  .on('end', () => {
    res.json({ message: 'Video processing completed successfully.', outputFilePath });
  })
  .on('error', (err) => {
    console.error('Error processing video:', err);
    res.status(500).json({ error: 'An error occurred while processing the video.' });
  })
  .save(outputFilePath);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Video processing service is running on port ${PORT}`);
});