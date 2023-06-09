import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Carousel from '../../components/Carousel'
import getResults from '../../utils/cachedImages'
import cloudinary from '../../utils/cloudinary'
import getBase64ImageUrl from '../../utils/generateBlurPlaceholder'
import type { ImageProps } from '../../utils/types'
import fs from 'fs'

const Home: NextPage = ({ currentPhoto }: { currentPhoto: ImageProps }) => {
  const router = useRouter()
  const { photoId } = router.query
  let index = 0//Number(photoId)

  const currentPhotoUrl = currentPhoto.public_id? currentPhoto.public_id : 'https://i.imgur.com/KCffzy1.jpeg'

  return (
    <>
      <Head>
        <title>Dalle-Gram 2023</title>
        <meta property="og:image" content={currentPhotoUrl} />
        <meta name="edit:image" content={currentPhotoUrl} />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel currentPhoto={currentPhoto} index={index} />
      </main>
    </>
  )
}

export default Home

export const getStaticProps: GetStaticProps = async (context) => {
  const results = null;///await getResults()

  let reducedResults: ImageProps[] = []
  let i = 0
  // for (let result of results?.resources) {
  //   reducedResults.push({
  //     id: i,
  //     height: result.height,
  //     width: result.width,
  //     public_id: result.public_id,
  //     format: result.format,
  //   })
  //   i++
  // }

  let currentPhoto = reducedResults.find(
    (img) => img.id === Number(context.params.photoId)
  )
  currentPhoto? currentPhoto : currentPhoto = {
    id: 0,
    height: '1500',
    width: '800',
    public_id: 'https://i.imgur.com/KCffzy1.jpeg',
    format: 'jpeg',
    blurDataUrl: 'https://i.imgur.com/KCffzy1.jpeg' 
  }

  return {
    props: {
      currentPhoto: currentPhoto,
    },
  }
}

export async function getStaticPaths() {
  let fullPaths = []
  const data = fs.readFileSync('image.txt', 'utf8')
  const urls = data.trim().split('\n')
  for (let i = 0; i < urls.length; i++) {
    fullPaths.push({ params: { photoId: i.toString() } })
  }

  return {
    paths: fullPaths,
    fallback: false,
  }
}
