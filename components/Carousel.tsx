import dynamic from 'next/dynamic';

const CarouselClient = dynamic(() => import('./CarouselClient'), { ssr: false });

export default CarouselClient;