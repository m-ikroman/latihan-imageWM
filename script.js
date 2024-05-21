document.getElementById("insertSection").style.display = "none";
document.getElementById("extractSection").style.display = "none";

function showInsert() {
  document.getElementById("insertSection").style.display = "block";
  document.getElementById("extractSection").style.display = "none";
  document.getElementById("resultSection").style.display = "none";
}

function showExtract() {
  document.getElementById("insertSection").style.display = "none";
  document.getElementById("extractSection").style.display = "block";
  document.getElementById("resultSection").style.display = "none";
}

function insertWatermark() {
  const coverImage = document.getElementById("coverImage").files[0];
  const watermarkImage = document.getElementById("watermarkImage").files[0];
  const key = document.getElementById("insertKey").value;

  if (coverImage && watermarkImage && key) {
    const coverImg = new Image();
    const watermarkImg = new Image();
    const canvas = document.getElementById("canvasOutput");
    const ctx = canvas.getContext("2d");

    coverImg.onload = () => {
      canvas.width = coverImg.width;
      canvas.height = coverImg.height;
      ctx.drawImage(coverImg, 0, 0);

      watermarkImg.onload = () => {
        const watermarkCanvas = document.createElement("canvas");
        watermarkCanvas.width = coverImg.width;
        watermarkCanvas.height = coverImg.height;
        const wctx = watermarkCanvas.getContext("2d");
        wctx.drawImage(watermarkImg, 0, 0, coverImg.width, coverImg.height);
        const coverData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const watermarkData = wctx.getImageData(
          0,
          0,
          coverImg.width,
          coverImg.height
        );

        const cipher = encryptLSB(coverData.data, watermarkData.data, key);
        for (let i = 0; i < cipher.length; i++) {
          coverData.data[i] = cipher[i];
        }
        ctx.putImageData(coverData, 0, 0);
        const resultImage = document.getElementById("resultImage");
        resultImage.src = canvas.toDataURL();
        resultImage.style.display = "block";
        document.getElementById("resultSection").style.display = "block";

        // Enable the download button
        const downloadBtn = document.getElementById("downloadBtn");
        downloadBtn.style.display = "inline";
        downloadBtn.onclick = function () {
          downloadImage(canvas, "watermarked_image.png");
        };
      };
      watermarkImg.src = URL.createObjectURL(watermarkImage);
    };
    coverImg.src = URL.createObjectURL(coverImage);
  }
}

function extractWatermark() {
  const watermarkedImage = document.getElementById("watermarkedImage").files[0];
  const key = document.getElementById("extractKey").value;

  if (watermarkedImage && key) {
    const img = new Image();
    const canvas = document.getElementById("canvasExtract");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const plain = decryptLSB(imageData.data, key);
      const watermarkCanvas = document.createElement("canvas");
      const wctx = watermarkCanvas.getContext("2d");
      watermarkCanvas.width = canvas.width;
      watermarkCanvas.height = canvas.height;

      for (let i = 0; i < plain.length; i++) {
        const pixelIndex = i * 4;
        wctx.fillStyle = plain[i] ? "black" : "white";
        wctx.fillRect(i % canvas.width, Math.floor(i / canvas.width), 1, 1);
      }
      document.getElementById("resultImage").src = watermarkCanvas.toDataURL();
      document.getElementById("resultSection").style.display = "block";
    };
    img.src = URL.createObjectURL(watermarkedImage);
  }
}

function encryptLSB(coverData, watermarkData, key) {
  const cipher = new Uint8ClampedArray(coverData.length);

  for (let i = 0; i < coverData.length; i += 4) {
    cipher[i] = (coverData[i] & 0xfe) | (watermarkData[i] & 1);
    cipher[i + 1] = (coverData[i + 1] & 0xfe) | (watermarkData[i + 1] & 1);
    cipher[i + 2] = (coverData[i + 2] & 0xfe) | (watermarkData[i + 2] & 1);
    cipher[i + 3] = coverData[i + 3]; // Alpha channel
  }
  return cipher;
}

function decryptLSB(cipherData, key) {
  const plain = new Uint8ClampedArray(cipherData.length / 4);

  for (let i = 0; i < cipherData.length; i += 4) {
    plain[i / 4] =
      (cipherData[i] & 1) |
      ((cipherData[i + 1] & 1) << 1) |
      ((cipherData[i + 2] & 1) << 2);
  }
  return plain;
}

function downloadImage(canvas, filename) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL();
  link.download = filename;
  link.click();
}
