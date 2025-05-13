# SumMed Python Integration Guide

This document explains how to integrate your Python OCR and NLP models with the SumMed mobile application.

## Overview

The SumMed application is designed to scan medicine boxes, extract the medicine name and dosage information using OCR, and then provide a summarized leaflet using NLP. The application has placeholders for these functionalities that need to be connected to your Python models.

## Setting Up the Python Backend

### 1. OCR Model Integration

Create a Python server that exposes an API endpoint to receive images and extract medicine information:

```python
from flask import Flask, request, jsonify
import base64
import io
from PIL import Image
import your_ocr_model  # Import your custom OCR model

app = Flask(__name__)

@app.route('/process-image', methods=['POST'])
def process_image():
    # Get image data from request
    data = request.json
    image_data = data.get('image')

    # Decode base64 image
    image = Image.open(io.BytesIO(base64.b64decode(image_data)))

    # Process image with your OCR model
    medicine_name, dosage = your_ocr_model.extract_medicine_info(image)

    # Return the extracted information
    return jsonify({
        'medicineName': medicine_name,
        'dosage': dosage,
        'success': True if medicine_name and dosage else False
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 2. NLP Model Integration

Create an endpoint to process the medicine name and dosage and return summarized leaflet information:

```python
@app.route('/get-leaflet', methods=['POST'])
def get_leaflet():
    # Get medicine information from request
    data = request.json
    medicine_name = data.get('medicineName')
    dosage = data.get('dosage')

    # Process with your NLP model
    leaflet_data = your_nlp_model.summarize_leaflet(medicine_name, dosage)

    # Return the summarized information
    return jsonify({
        'name': medicine_name,
        'dosage': dosage,
        'intendedUse': leaflet_data.get('intended_use', ''),
        'howToUse': leaflet_data.get('how_to_use', []),
        'notRecommendedFor': leaflet_data.get('not_recommended_for', '')
    })
```

## Integrating with the Mobile App

### 1. Update the OCR Integration

Open the file `app/scan-medicine.tsx` and replace the mock function with a real API call:

```typescript
const processMedicineImageWithOCR = async (imageUri: string) => {
  try {
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Remove data URL prefix
    const base64Data = (base64 as string).split(",")[1];

    // Send to Python OCR server
    const apiResponse = await fetch("http://your-server-url/process-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Data,
      }),
    });

    return await apiResponse.json();
  } catch (error) {
    console.error("Error processing image with OCR:", error);
    return { success: false };
  }
};
```

### 2. Update the NLP Integration

Open the file `app/leaflet.tsx` and replace the mock function with a real API call:

```typescript
const getSummarizedLeaflet = async (
  medicineName: string,
  dosage: string
): Promise<LeafletData> => {
  try {
    // Send to Python NLP server
    const apiResponse = await fetch("http://your-server-url/get-leaflet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        medicineName,
        dosage,
      }),
    });

    return await apiResponse.json();
  } catch (error) {
    console.error("Error getting leaflet data:", error);
    // Return fallback data
    return {
      name: medicineName,
      dosage: dosage,
      intendedUse: "Could not retrieve information. Please try again.",
      howToUse: ["Information not available"],
      notRecommendedFor: "Information not available",
    };
  }
};
```

## Deployment Considerations

1. **Security**: Ensure your Python server has proper authentication and security measures.
2. **CORS**: Configure your Python server to accept requests from your mobile app.
3. **Error Handling**: Implement comprehensive error handling on both the backend and frontend.
4. **Scaling**: Consider how your solution will scale with increased usage and larger datasets.

## Testing the Integration

1. Start your Python server.
2. Run the mobile app in development mode: `npm start`
3. Test the OCR functionality by taking a photo of a medicine box.
4. Verify that the NLP integration correctly summarizes and displays the leaflet information.

---

For any questions or additional support, please contact the development team.
