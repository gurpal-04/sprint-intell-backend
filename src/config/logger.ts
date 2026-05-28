import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const resolveTransport = (): pino.TransportSingleOptions | undefined => {
  if (isProd) {
    return undefined;
  }

  try {
    require.resolve("pino-pretty");
    return { target: "pino-pretty", options: { colorize: true } };
  } catch {
    return undefined;
  }
};

export const logger = pino({
  level: isProd ? "info" : "debug",
  transport: resolveTransport(),
});
