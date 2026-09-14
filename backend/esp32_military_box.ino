/*
 * Military Box ESP32 Telemetry Firmware (Arduino C++)
 * 
 * Features:
 * - Connects ESP32 to Wi-Fi
 * - Authenticates with FastAPI using X-Device-Token header
 * - Reads sensor telemetry (Temperature, Humidity, Vibration, Door Tamper, Battery Voltage, GPS)
 * - Serializes payload into JSON using ArduinoJson library
 * - Sends HTTP POST request to FastAPI backend (/api/v1/telemetry)
 * 
 * Dependencies (Install via Arduino Library Manager):
 * 1. ArduinoJson (by Benoit Blanchon)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ================= USER CONFIGURATION =================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Replace with your laptop/server IP address
const char* FASTAPI_SERVER_URL = "http://192.168.1.5:8000/api/v1/telemetry";

// ESP32 Device Secret Authentication Token (Must match API_SECRET_KEY in FastAPI backend)
const char* DEVICE_SECRET_TOKEN = "military_box_secret_token_2026";

const char* DEVICE_ID = "ESP32_MILITARY_BOX_01";
const int SEND_INTERVAL_MS = 10000; // Send telemetry every 10 seconds

// Pin Definitions
const int VIBRATION_PIN = 4;   // SW-420 Vibration Sensor Pin
const int DOOR_REED_PIN = 5;   // Magnetic Reed Switch Pin
const int BATTERY_ADC_PIN = 34; // Battery Voltage Divider Pin

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n==========================================");
  Serial.println("   Military Box ESP32 Microcontroller    ");
  Serial.println("==========================================");

  pinMode(VIBRATION_PIN, INPUT);
  pinMode(DOOR_REED_PIN, INPUT_PULLUP);
  pinMode(BATTERY_ADC_PIN, INPUT);

  // Connect Wi-Fi
  connectWiFi();
}

// ================= MAIN LOOP =================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 1. Read Sensors
  float temperature = readTemperature();
  float humidity = readHumidity();
  bool vibrationDetected = (digitalRead(VIBRATION_PIN) == HIGH);
  bool doorOpen = (digitalRead(DOOR_REED_PIN) == HIGH); // HIGH if circuit opened (door open)
  float batteryVoltage = readBatteryVoltage();
  
  // Simulated GPS (Replace with Neo-6M GPS library if hardware attached)
  float latitude = 28.6139;
  float longitude = 77.2090;

  // 2. Build JSON Payload
  StaticJsonDocument<300> doc;
  doc["device_id"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["vibration_detected"] = vibrationDetected;
  doc["door_open"] = doorOpen;
  doc["battery_voltage"] = batteryVoltage;
  doc["latitude"] = latitude;
  doc["longitude"] = longitude;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // 3. Send HTTP POST to FastAPI
  sendTelemetryToFastAPI(jsonPayload);

  delay(SEND_INTERVAL_MS);
}

// ================= HELPER FUNCTIONS =================
void connectWiFi() {
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected Successfully!");
    Serial.print("[Wi-Fi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Connection Failed. Will retry in loop...");
  }
}

void sendTelemetryToFastAPI(String jsonString) {
  HTTPClient http;
  
  Serial.println("\n------------------------------------------");
  Serial.print("Sending Authenticated Payload to: ");
  Serial.println(FASTAPI_SERVER_URL);
  Serial.println("Payload: " + jsonString);

  http.begin(FASTAPI_SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  // Attach Authentication Token Header
  http.addHeader("X-Device-Token", DEVICE_SECRET_TOKEN);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    Serial.println("Response: " + response);
  } else {
    Serial.print("HTTP Request Failed, error: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

// Dummy/Placeholder sensor readings (Replace with actual sensor drivers e.g. DHT22/MPU6050)
float readTemperature() {
  return 25.4 + (random(-10, 10) / 10.0);
}

float readHumidity() {
  return 55.0 + (random(-20, 20) / 10.0);
}

float readBatteryVoltage() {
  int rawADC = analogRead(BATTERY_ADC_PIN);
  return (rawADC / 4095.0) * 2 * 3.3; // ADC scaling for voltage divider
}
