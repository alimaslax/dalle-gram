import * as Generation from "../../generation/generation_pb";
import { GenerationServiceClient } from "../../generation/generation_pb_service";
import { grpc as GRPCWeb } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import fs from "fs";
import {
  buildGenerationRequest,
  executeGenerationRequest,
  GenerationArtifacts,
  GenerationResponse,
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
      const prompt = req.body.prompt;
      const request = buildGenerationRequest("stable-diffusion-512-v2-1", {
        type: "text-to-image",
        prompts: [
          {
            text: prompt,
          },
        ],
        width: 512,
        height: 512,
        samples: 1,
        cfgScale: 13,
        steps: 25,
        sampler: Generation.DiffusionSampler.SAMPLER_K_DPMPP_2M,
      });

      executeGenerationRequest(client, request, metadata)
        .then((response: GenerationArtifacts) => {
          // Do something with the successful image artifacts
          response.imageArtifacts.forEach((artifact: Generation.Artifact) => {
            try {
              const imgBuffer = Buffer.from(artifact.getBinary_asU8());
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
