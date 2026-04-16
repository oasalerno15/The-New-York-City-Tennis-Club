'use client';

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  /** Full-bleed photo backdrop; only used when backdrop is "image". */
  bgImageSrc?: string;
  /** "darkGreen" = navy brand hero (prop name kept); "light" = white studio; "image" = photo + overlays. */
  backdrop?: 'light' | 'image' | 'darkGreen';
  title?: string;
  /** Shown above the video (e.g. club name). Uses premium serif from root layout. */
  videoOverlayTitle?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
  disableScrollBlocking?: boolean;
  /** Fired when hero scroll-to-expand progress changes (0–1). */
  onScrollProgressChange?: (progress: number) => void;
}

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  backdrop = 'darkGreen',
  title,
  videoOverlayTitle,
  scrollToExpand = 'Scroll down',
  textBlend: _textBlend,
  children,
  disableScrollBlocking = false,
  onScrollProgressChange,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  /** Keeps latest expanded flag for wheel/touch/scroll handlers without re-binding listeners. */
  const mediaFullyExpandedRef = useRef(mediaFullyExpanded);
  mediaFullyExpandedRef.current = mediaFullyExpanded;
  const touchStartYRef = useRef<number | null>(null);
  const progressRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!onScrollProgressChange) return;
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current);
    }
    progressRafRef.current = requestAnimationFrame(() => {
      progressRafRef.current = null;
      onScrollProgressChange(scrollProgress);
    });
    return () => {
      if (progressRafRef.current !== null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
    };
  }, [scrollProgress, onScrollProgressChange]);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const expanded = mediaFullyExpandedRef.current;
      if (expanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!expanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        setScrollProgress((prev) => {
          const newProgress = Math.min(Math.max(prev + scrollDelta, 0), 1);
          if (newProgress >= 1) {
            setMediaFullyExpanded(true);
            setShowContent(true);
          } else if (newProgress < 0.75) {
            setShowContent(false);
          }
          return newProgress;
        });
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const startY = touchStartYRef.current;
      if (startY === null) return;

      const touchY = e.touches[0].clientY;
      const deltaY = startY - touchY;
      const expanded = mediaFullyExpandedRef.current;

      if (expanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!expanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        setScrollProgress((prev) => {
          const newProgress = Math.min(Math.max(prev + scrollDelta, 0), 1);
          if (newProgress >= 1) {
            setMediaFullyExpanded(true);
            setShowContent(true);
          } else if (newProgress < 0.75) {
            setShowContent(false);
          }
          return newProgress;
        });
      }
    };

    const handleTouchEnd = (): void => {
      touchStartYRef.current = null;
    };

    const handleScroll = (): void => {
      if (
        !disableScrollBlocking &&
        !mediaFullyExpandedRef.current &&
        window.scrollY > 0
      ) {
        window.scrollTo(0, 0);
      }
    };

    if (!disableScrollBlocking) {
      window.addEventListener('wheel', handleWheel as unknown as EventListener, {
        passive: false,
      });
      window.addEventListener('scroll', handleScroll as unknown as EventListener, {
        passive: true,
      });
      window.addEventListener(
        'touchstart',
        handleTouchStart as unknown as EventListener,
        { passive: false }
      );
      window.addEventListener(
        'touchmove',
        handleTouchMove as unknown as EventListener,
        { passive: false }
      );
      window.addEventListener('touchend', handleTouchEnd as EventListener);
    }

    return () => {
      if (!disableScrollBlocking) {
        window.removeEventListener(
          'wheel',
          handleWheel as unknown as EventListener
        );
        window.removeEventListener('scroll', handleScroll as unknown as EventListener);
        window.removeEventListener(
          'touchstart',
          handleTouchStart as unknown as EventListener
        );
        window.removeEventListener(
          'touchmove',
          handleTouchMove as unknown as EventListener
        );
        window.removeEventListener('touchend', handleTouchEnd as EventListener);
      }
    };
  }, [disableScrollBlocking]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const mediaWidth = 340 + scrollProgress * (isMobileState ? 330 : 880);
  const mediaHeight = 410 + scrollProgress * (isMobileState ? 200 : 520);

  const isLight = backdrop === 'light';
  const isDarkGreen = backdrop === 'darkGreen';
  const heroTitle = videoOverlayTitle ?? title;
  /** Desktop (≥768): light hero stacks title → media → scroll hint under the frame. */
  const isDesktopLight = isLight && !isMobileState;

  const renderScrollExpandHint = (wrapperClass: string) => (
    <motion.div
      className={`z-10 flex flex-col items-center ${wrapperClass}`}
      style={{ opacity: Math.max(0, 1 - scrollProgress * 1.4) }}
    >
      <motion.p
        className={`text-center text-lg font-medium tracking-[0.35em] md:text-xl ${isLight ? 'text-[#2D5A27]' : 'text-white/90'}`}
        style={{
          fontFamily: 'var(--font-display-serif), Georgia, serif',
          textShadow: isLight
            ? '0 1px 10px rgba(255,255,255,0.5)'
            : '0 2px 16px rgba(0,0,0,0.45)',
        }}
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {scrollToExpand}
      </motion.p>
      <motion.span
        aria-hidden
        className={`mt-2 ${isLight ? 'text-[#2D5A27]' : 'text-white/70'}`}
        style={{ opacity: 0.9 }}
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.15,
        }}
      >
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          className='mx-auto'
        >
          <path d='M12 5v14M5 12l7 7 7-7' />
        </svg>
      </motion.span>
    </motion.div>
  );

  return (
    <div
      ref={sectionRef}
      className='transition-colors duration-700 ease-in-out overflow-x-hidden'
    >
      <section className='relative flex flex-col items-center justify-start min-h-[100dvh]'>
        <div className='relative w-full flex flex-col items-center min-h-[100dvh]'>
          <motion.div
            className='absolute inset-0 z-0 h-full'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            {isLight ? (
              <div className='absolute inset-0 bg-white' />
            ) : isDarkGreen ? (
              <div className='absolute inset-0 bg-[#1e3a5f]'>
                <div
                  className='absolute inset-0 bg-gradient-to-b from-[#2e4f7a] via-[#1e3a5f] to-[#0f1f33]'
                  aria-hidden
                />
                <div
                  className='absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_0%,rgba(255,255,255,0.07),transparent_52%)]'
                  aria-hidden
                />
              </div>
            ) : (
              bgImageSrc && (
                <>
                  <Image
                    src={bgImageSrc}
                    alt=''
                    width={1920}
                    height={1080}
                    className='w-screen h-screen scale-105'
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                    priority
                  />
                  <div
                    className='absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-[#07120e]/92'
                    aria-hidden
                  />
                  <div
                    className='absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_0%,rgba(0,0,0,0.45)_100%)]'
                    aria-hidden
                  />
                </>
              )
            )}
          </motion.div>

          <div className='container mx-auto flex flex-col items-center justify-start relative z-10'>
            <div className={`flex w-full min-h-[100dvh] flex-col items-center relative pb-2 md:pb-3 ${isLight ? 'pt-[max(0rem,env(safe-area-inset-top))] md:pt-0' : 'pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-8'}`}>
              {heroTitle ? (
                <h1
                  className={`relative z-10 mx-auto mb-4 max-w-[min(100%,40rem)] px-4 text-center text-[clamp(1.65rem,3.8vw,2.75rem)] font-semibold leading-[1.1] tracking-[0.02em] md:mb-5 ${isLight ? 'text-[#2D5A27]' : 'text-white'}`}
                  style={{
                    fontFamily: 'var(--font-display-serif), Georgia, serif',
                    ...(isLight
                      ? {}
                      : {
                          textShadow:
                            '0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.25)',
                        }),
                  }}
                >
                  {heroTitle}
                </h1>
              ) : null}

              <div
                className={`relative z-0 flex min-h-0 w-full justify-center ${
                  isDesktopLight
                    ? 'flex flex-1 flex-col items-center justify-start pt-0'
                    : isLight
                      ? 'flex-1 items-start pt-0'
                      : 'flex-1 items-center pt-8 md:pt-14 lg:pt-16'
                }`}
              >
                <div
                  className='relative transition-none rounded-2xl'
                  style={{
                    width: `${mediaWidth}px`,
                    height: `${mediaHeight}px`,
                    maxWidth: isLight ? '97vw' : '95vw',
                    maxHeight: isLight ? 'min(62vh, calc(100dvh - 11rem))' : 'min(85vh, calc(100dvh - 14rem))',
                    boxShadow: isLight
                      ? '0 32px 64px -16px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06)'
                      : '0 28px 70px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.12), 0 0 48px rgba(255,255,255,0.06)',
                  }}
                >
                {mediaType === 'video' ? (
                  mediaSrc.includes('youtube.com') ? (
                    <div className='relative w-full h-full pointer-events-none'>
                      <iframe
                        width='100%'
                        height='100%'
                        src={
                          mediaSrc.includes('embed')
                            ? mediaSrc +
                              (mediaSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : mediaSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              mediaSrc.split('v=')[1]
                        }
                        className='w-full h-full rounded-xl'
                        frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                      />
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                    <motion.div
                      className={`absolute inset-0 rounded-xl ${isLight ? 'bg-black/15' : 'bg-black/35'}`}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: (isLight ? 0.35 : 0.5) - scrollProgress * 0.2 }}
                      transition={{ duration: 0.2 }}
                    />
                    <div
                      className='absolute inset-0 z-[18] flex items-center justify-center px-4 pointer-events-none'
                      style={{
                        fontFamily: 'var(--font-display-serif), Georgia, serif',
                      }}
                    >
                      <GooeyText
                        texts={[
                          'Find a court',
                          'Beat the wait',
                          'Powered by players',
                          'For players',
                        ]}
                        morphTime={0.55}
                        cooldownTime={1.05}
                        className='flex w-full max-w-[min(100%,32rem)] items-center justify-center md:max-w-[min(100%,42rem)]'
                        textClassName={`block w-full text-center text-[clamp(1.55rem,4.4vw,3.15rem)] font-semibold !leading-snug tracking-[0.02em] md:text-5xl lg:text-6xl ${isLight ? 'text-[#1A1A1A] drop-shadow-[0_2px_18px_rgba(255,253,208,0.45)]' : 'text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.9)]'}`}
                      />
                    </div>
                  </div>
                ) : (
                    <div className='relative w-full h-full pointer-events-none'>
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload='auto'
                        className='w-full h-full object-cover rounded-xl'
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                      <motion.div
                        className={`absolute inset-0 rounded-xl ${isLight ? 'bg-black/15' : 'bg-black/35'}`}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: (isLight ? 0.35 : 0.5) - scrollProgress * 0.2 }}
                        transition={{ duration: 0.2 }}
                      />
                    <div
                      className='absolute inset-0 z-[18] flex items-center justify-center px-4 pointer-events-none'
                      style={{
                        fontFamily: 'var(--font-display-serif), Georgia, serif',
                      }}
                    >
                      <GooeyText
                        texts={[
                          'Find a court',
                          'Beat the wait',
                          'Powered by players',
                          'For players',
                        ]}
                        morphTime={0.55}
                        cooldownTime={1.05}
                        className='flex w-full max-w-[min(100%,32rem)] items-center justify-center md:max-w-[min(100%,42rem)]'
                        textClassName={`block w-full text-center text-[clamp(1.55rem,4.4vw,3.15rem)] font-semibold !leading-snug tracking-[0.02em] md:text-5xl lg:text-6xl ${isLight ? 'text-[#1A1A1A] drop-shadow-[0_2px_18px_rgba(255,253,208,0.45)]' : 'text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.9)]'}`}
                      />
                    </div>
                    </div>
                  )
                ) : (
                  <div className='relative w-full h-full'>
                    <Image
                      src={mediaSrc}
                      alt={title || 'Media content'}
                      width={1280}
                      height={720}
                      className='w-full h-full object-cover rounded-xl'
                    />

                    <motion.div
                      className='absolute inset-0 bg-black/50 rounded-xl'
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}
                </div>
                {isDesktopLight
                  ? renderScrollExpandHint(
                      'mt-5 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:mt-7'
                    )
                  : null}
              </div>

              {!isDesktopLight
                ? renderScrollExpandHint(
                    isLight
                      ? 'relative mt-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
                      : 'relative mt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:mt-6 md:pb-8'
                  )
                : null}
            </div>

            <motion.section
              className='flex flex-col w-full px-8 py-10 md:px-16 lg:py-20'
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia; 