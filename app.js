import { openStreamDeck } from "@elgato-stream-deck/node";
import { constants, F1TelemetryClient } from "@racehub-io/f1-telemetry-client";
import jimp from "jimp";
const { PACKETS } = constants;
const font = await jimp.loadFont("font.fnt");
const sd = await openStreamDeck();

const revLightsIndexOrder = [10, 5, 0, 1, 2, 3, 4, 9, 14];

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

client.start();
