# Usage Examples for Local Files

## 📁 **Public Folder Structure**

Create this folder structure in your project:

```
public/
├── images/
│   ├── hero-background.jpg
│   ├── product-showcase.png
│   └── underwater-scene.webp
├── videos/
│   ├── demo-video.mp4
│   └── video-poster.jpg
└── backgrounds/
    ├── cosmic-background.jpg
    └── nature-background.jpg
```

## 🖼️ **Image Examples**

### **Local Image Usage:**
```tsx
const sampleMediaContent: MediaContentCollection = {
  image: {
    src: '/images/product-showcase.png',           // Local image
    background: '/backgrounds/nature-background.jpg', // Local background
    title: 'Your Product Title',
    date: 'Launch Date',
    scrollToExpand: 'Scroll to see more',
    about: {
      overview: 'Your product description...',
      conclusion: 'Your conclusion...'
    }
  }
};
```

### **Image Requirements:**
- **Formats**: JPG, PNG, WebP, GIF, SVG
- **Resolution**: 1920x1080 or higher for backgrounds
- **File Size**: Keep under 2MB for performance
- **Naming**: Use descriptive names, no spaces

## 🎥 **Video Examples**

### **Local Video Usage:**
```tsx
const sampleMediaContent: MediaContentCollection = {
  video: {
    src: '/videos/demo-video.mp4',                // Local video
    poster: '/videos/video-poster.jpg',           // Local poster
    background: '/backgrounds/cosmic-background.jpg', // Local background
    title: 'Your Video Title',
    date: 'Release Date',
    scrollToExpand: 'Scroll to expand',
    about: {
      overview: 'Your video description...',
      conclusion: 'Your conclusion...'
    }
  }
};
```

### **Video Requirements:**
- **Format**: MP4 (H.264 codec recommended)
- **Resolution**: 1920x1080 or higher
- **Duration**: Any length (component handles looping)
- **File Size**: Keep reasonable for web (under 50MB recommended)

## 🔄 **Mixed Usage (Local + External)**

You can mix local and external files:

```tsx
const sampleMediaContent: MediaContentCollection = {
  video: {
    src: '/videos/my-video.mp4',                  // Local video
    poster: 'https://external.com/poster.jpg',    // External poster
    background: '/backgrounds/my-bg.jpg',         // Local background
    title: 'Mixed Sources Example',
    date: 'Today',
    scrollToExpand: 'Scroll to expand',
    about: {
      overview: 'This shows mixed local and external sources...',
      conclusion: 'Flexible approach...'
    }
  }
};
```

## 📱 **Responsive Image Sizes**

For best performance, consider multiple image sizes:

```
public/
├── images/
│   ├── hero-background.jpg      (1920x1080 - desktop)
│   ├── hero-background-md.jpg   (1280x720 - tablet)
│   └── hero-background-sm.jpg   (768x432 - mobile)
```

## 🚀 **Quick Start Steps**

1. **Create folders** in `public/` directory
2. **Upload your files** (images/videos)
3. **Update the paths** in `demo.tsx`
4. **Test locally** with `npm run dev`

## 💡 **Pro Tips**

- **Optimize images** before uploading (use tools like TinyPNG)
- **Use WebP format** for better compression
- **Keep file names** descriptive and consistent
- **Test on different devices** to ensure performance
- **Consider CDN** for production (like Cloudinary, AWS S3) 