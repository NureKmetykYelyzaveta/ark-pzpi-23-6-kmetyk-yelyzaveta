#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>


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


void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);


  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED not found");
    while (true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);


  ds18b20.begin();


  if (!mpu.begin()) {
    Serial.println("MPU6050 not found");
    while (true);
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("ShelterMonitor SmartDevice started");
}


void loop() {
  ds18b20.requestTemperatures();
  float temperature = ds18b20.getTempCByIndex(0);


  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float motionLevel = sqrt(
    a.acceleration.x * a.acceleration.x +
    a.acceleration.y * a.acceleration.y +
    a.acceleration.z * a.acceleration.z
  ) / 9.81;


  bool tempAlert = (temperature < TEMP_MIN || temperature > TEMP_MAX);
  bool motionAlert = (motionLevel > MOTION_LIMIT);


  Serial.println("===== Shelter Telemetry =====");
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Motion level: ");
  Serial.println(motionLevel);

  Serial.print("Temperature status: ");
  Serial.println(tempAlert ? "ALERT" : "OK");

  Serial.print("Motion status: ");
  Serial.println(motionAlert ? "ACTIVE" : "NORMAL");
  Serial.println();


  display.clearDisplay();
  display.setCursor(0, 0);

  display.println("Shelter Monitor");

  display.print("Temp: ");
  display.print(temperature);
  display.println(" C");

  display.print("Motion: ");
  display.println(motionLevel, 2);

  display.print("Temp state: ");
  display.println(tempAlert ? "ALERT" : "OK");

  display.print("Activity: ");
  display.println(motionAlert ? "ACTIVE" : "NORMAL");

  display.display();

  delay(2000);
}
