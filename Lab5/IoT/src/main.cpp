#include <Arduino.h>

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

#include <math.h>

#define ONE_WIRE_BUS 16
#define SDA_PIN 21
#define SCL_PIN 22

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

Adafruit_MPU6050 mpu;

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

const float TEMP_MIN = 18.0;
const float TEMP_MAX = 30.0;
const float MOTION_LIMIT = 1.5;

static const char* WIFI_SSID = "Wokwi-GUEST";
static const char* WIFI_PASS = "";


static const char* API_BASE = "https://ark-pzpi-23-6-kmetyk-yelyzaveta.onrender.com";


static const char* DEVICE_GUID = "DEV-002";


static const char* DEVICE_KEY = "kmetyk-iot-2025-xyz";

static const char* TELEMETRY_PATH = "/api/iot/telemetry";

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("WiFi connecting");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 20000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi OK, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi FAILED (continuing offline)");
  }
}

bool postTelemetry(float tempC, float motion, bool tempAlert, bool motionAlert) {
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(API_BASE) + TELEMETRY_PATH;

  if (!http.begin(client, url)) {
    Serial.println("HTTP begin failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  String body = "{";
  body += "\"deviceGuid\":\"" + String(DEVICE_GUID) + "\",";
  body += "\"tempC\":" + String(tempC, 2) + ",";
  body += "\"motion\":" + String(motion, 2) + ",";
  body += "\"tempAlert\":" + String(tempAlert ? "true" : "false") + ",";
  body += "\"motionAlert\":" + String(motionAlert ? "true" : "false");
  body += "}";

  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  Serial.print("POST /api/iot/telemetry code=");
  Serial.print(code);
  Serial.print(" resp=");
  Serial.println(resp);

  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Wire.begin(SDA_PIN, SCL_PIN);

  
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("❌ OLED not found");
    while (true) delay(100);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);


  ds18b20.begin();


  if (!mpu.begin()) {
    Serial.println("❌ MPU6050 not found");
    while (true) delay(100);
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("✅ ShelterMonitor SmartDevice started");


  connectWiFi();
}

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

 
  ds18b20.requestTemperatures();
  float temperature = ds18b20.getTempCByIndex(0);

  bool tempReadOk = (temperature > -100.0 && temperature < 125.0);

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float motionLevel =
    sqrt(
      a.acceleration.x * a.acceleration.x +
      a.acceleration.y * a.acceleration.y +
      a.acceleration.z * a.acceleration.z
    ) / 9.81;

  bool tempAlert = (!tempReadOk) || (temperature < TEMP_MIN || temperature > TEMP_MAX);
  bool motionAlert = (motionLevel > MOTION_LIMIT);

  Serial.println("===== Shelter Telemetry =====");

  Serial.print("Temperature: ");
  if (tempReadOk) {
    Serial.print(temperature);
    Serial.println(" C");
  } else {
    Serial.println("SENSOR ERROR");
  }

  Serial.print("Motion level: ");
  Serial.println(motionLevel, 2);

  Serial.print("Temperature status: ");
  Serial.println(tempAlert ? "ALERT" : "OK");

  Serial.print("Motion status: ");
  Serial.println(motionAlert ? "ACTIVE" : "NORMAL");
  Serial.println();

  display.clearDisplay();
  display.setCursor(0, 0);

  display.println("Shelter Monitor");

  display.print("Temp: ");
  if (tempReadOk) {
    display.print(temperature);
    display.println(" C");
  } else {
    display.println("ERROR");
  }

  display.print("Motion: ");
  display.println(motionLevel, 2);

  display.print("Temp state: ");
  display.println(tempAlert ? "ALERT" : "OK");

  display.print("Activity: ");
  display.println(motionAlert ? "ACTIVE" : "NORMAL");

  display.display();


  float tempToSend = tempReadOk ? temperature : -127.0;
  postTelemetry(tempToSend, motionLevel, tempAlert, motionAlert);

  delay(2000);
}
