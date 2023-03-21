import * as Generation from "../../generation/generation_pb";
import { GenerationServiceClient } from "../../generation/generation_pb_service";
import { grpc as GRPCWeb } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import sharp from "sharp";

import {
  buildGenerationRequest,
  executeGenerationRequest,
  GenerationArtifacts,
} from "../../generation/helpers";

// This is a NodeJS-specific requirement - browsers implementations should omit this line.
GRPCWeb.setDefaultTransport(NodeHttpTransport());

// Authenticate using your API key, don't commit your key to a public repository!
const metadata = new GRPCWeb.Metadata();
metadata.set("Authorization", "Bearer " + process.env.API_KEY);

// Create a generation client to use with all future requests
const client = new GenerationServiceClient("https://grpc.stability.ai", {});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb", // Set desired value here
    },
  },
};


export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // DreamStudio uses an Image Strength slider to control the influence of the initial image on the final result.
      // This "Image Strength" is a value from 0-1, where values close to 1 yield images very similar to the init_image
      // and values close to 0 yield imges wildly different than the init_image. This is just another way to calculate
      // stepScheduleStart, which is done via the following formula: stepScheduleStart = 1 - imageStrength.  This means
      // an image strength of 35% would result in a stepScheduleStart of 0.65.
      console.log("$$$$$$$$$$");
      const imageType = "image/png";
      const imageBase64Data = req.body.image.split(',')[1];
      const maskBase64Data = req.body.mask.split(',')[1];
      const prompt = req.body.prompt;
      const wrappedPrompt = `${prompt}, match STYLE to the image. Reference image: original image. gray areas should be completely replaced.`;
      let imageBuffer = Buffer.from(imageBase64Data, "base64");
      let editBuffer = Buffer.from(maskBase64Data, "base64");

      // Resize the image to a square aspect ratio
      imageBuffer = await sharp(imageBuffer)
      .resize({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true
      })
      .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

      // Resize the mask to a square aspect ratio
      editBuffer = await sharp(editBuffer)
      .resize({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true
      })
      .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

      // fs.writeFileSync(
      //   `image-${`test`}.png`,
      //   Buffer.from(imageBuffer)
      // );
      // fs.writeFileSync(
      //   `mask-${`test`}.png`,
      //   Buffer.from(editBuffer)
      // );

      const imageStrength = 0.35;
      const request = buildGenerationRequest("stable-diffusion-512-v2-1", {
        type: "image-to-image-masking",
        initImage: imageBuffer,
        maskImage: editBuffer,
        prompts: [
          {
            text: wrappedPrompt,
          },
        ],
        samples: 1,
        cfgScale: 7,
        steps: 30,
        sampler: Generation.DiffusionSampler.SAMPLER_K_DPMPP_2M,
      });
      
      await executeGenerationRequest(client, request, metadata)
        .then((response: GenerationArtifacts) => {
          // Do something with the successful image artifacts
          response.imageArtifacts.forEach((artifact: Generation.Artifact) => {
            try {
              const imgBuffer = Buffer.from(artifact.getBinary_asU8());

              // fs.writeFileSync(
              //   `mask-${artifact.getSeed()}.png`,
              //   imgBuffer
              // );
              const completion = {
                data: [
                  {
                    url:
                      "data:image/png;base64," + imgBuffer.toString("base64"),
                  },
                ],
              };
              res.status(200).json(completion);
            } catch (error) {
              console.error("Failed to write resulting image to disk", error);
            }
          });
        })
        .catch((error) => {
          res.status(500).json({ error: "Stability Error" });
        });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
