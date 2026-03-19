const express = require('express');
const router = express.Router();
const { getSubtitles } = require('youtube-captions-scraper');
const ytdl = require('ytdl-core');

// Get YouTube video captions
router.post('/captions', async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    // Validate video ID format
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (!videoIdRegex.test(videoId)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Check if video exists and is accessible
    try {
      const info = await ytdl.getBasicInfo(videoUrl);
      if (!info) {
        return res.status(404).json({ message: 'Video not found' });
      }
    } catch (error) {
      console.error('Video info error:', error);
      return res.status(404).json({ message: 'Video not found or is private/restricted' });
    }

    // Try to get captions
    try {
      const captions = await getSubtitles({
        videoID: videoId,
        lang: 'en' // Default to English, can be made configurable
      });

      if (!captions || captions.length === 0) {
        // Try auto-generated captions
        try {
          const autoCaptions = await getSubtitles({
            videoID: videoId,
            lang: 'en',
            auto: true
          });

          if (!autoCaptions || autoCaptions.length === 0) {
            return res.status(404).json({ message: 'No captions available for this video' });
          }

          const captionText = autoCaptions.map(caption => caption.text).join(' ');
          return res.json({ 
            captions: captionText,
            type: 'auto-generated',
            language: 'en'
          });
        } catch (autoError) {
          console.error('Auto captions error:', autoError);
          return res.status(404).json({ message: 'No captions available for this video' });
        }
      }

      const captionText = captions.map(caption => caption.text).join(' ');
      res.json({ 
        captions: captionText,
        type: 'manual',
        language: 'en'
      });

    } catch (captionError) {
      console.error('Caption fetch error:', captionError);
      
      if (captionError.message?.includes('private')) {
        return res.status(403).json({ message: 'Video is private or restricted' });
      }
      
      if (captionError.message?.includes('not found')) {
        return res.status(404).json({ message: 'Video not found' });
      }

      return res.status(404).json({ message: 'No captions available for this video' });
    }

  } catch (error) {
    console.error('YouTube captions API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch captions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;