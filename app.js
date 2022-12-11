import { openStreamDeck } from "@elgato-stream-deck/node";
import { constants, F1TelemetryClient } from "@racehub-io/f1-telemetry-client";
import jimp from "jimp";
const { PACKETS } = constants;
const font = await jimp.loadFont("font.fnt");
const sd = await openStreamDeck();

let currentCarTelemetryData = undefined;

const revLightsIndexOrder = [10, 5, 0, 1, 2, 3, 4, 9, 14];
sd.clearPanel();

const displayOnKey = async (keyIndex, image, text) => {
  image.print(
    font,
    0,
    0,
    {
      text: `${text}`,
      alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: jimp.VERTICAL_ALIGN_MIDDLE,
    },
    72,
    72
  );
  sd.fillKeyBuffer(keyIndex, image.bitmap.data, { format: "rgba" });
};

const client = new F1TelemetryClient({ port: 20777 });
client.on(PACKETS.carTelemetry, async (packet) => {
  currentCarTelemetryData = packet.m_carTelemetryData;
  const speedImage = await jimp.read("assets/SpeedBG.png");
  const gearImage = await jimp.read("assets/GearBG.png");

  const speed = packet.m_carTelemetryData[0].m_speed;
  const gear = packet.m_carTelemetryData[0].m_gear;

  displayOnKey(6, speedImage, speed);
  displayOnKey(7, gearImage, gear);

  const revPercent = packet.m_carTelemetryData[0].m_revLightsPercent;
  const tillKey = Math.floor(revPercent / 11);
  for (let i = 0; i < 9; i++) {
    if (i <= tillKey && revPercent != 0) {
      if (i < 3) {
        sd.fillKeyColor(revLightsIndexOrder[i], 0, 255, 0);
      } else if (i < 6) {
        sd.fillKeyColor(revLightsIndexOrder[i], 255, 0, 0);
      } else {
        sd.fillKeyColor(revLightsIndexOrder[i], 255, 0, 255);
      }
    } else {
      sd.fillKeyColor(revLightsIndexOrder[i], 0, 0, 0);
    }
  }
});

client.on(PACKETS.lapData, async (packet) => {
  const lapImage = await jimp.read("assets/LapBG.png");
  const deltaSecondsImage = await jimp.read("assets/GearBG.png");
  const deltaMillisecondsImage = await jimp.read("assets/GearBG.png");

  const lap = packet.m_lapData[0].m_currentLapNum;

  displayOnKey(8, lapImage, lap);

  if (packet.m_timeTrialPBCarIdx != 255) {
    const deltaDistance =
      packet.m_lapData[0].m_lapDistance -
      packet.m_lapData[packet.m_timeTrialPBCarIdx].m_lapDistance;
    const deltaTime =
      deltaDistance / (currentCarTelemetryData[0].m_speed * 0.277778);
    const displayDeltaTime = deltaTime.toFixed(3);
    const [deltaSeconds, deltaMilliseconds] = `${displayDeltaTime}`.split(".");

    displayOnKey(12, deltaSecondsImage, deltaSeconds);
    displayOnKey(13, deltaMillisecondsImage, deltaMilliseconds);
  } else {
    displayOnKey(12, deltaSecondsImage, 0);
    displayOnKey(13, deltaMillisecondsImage, 0);
  }
});

client.start();
