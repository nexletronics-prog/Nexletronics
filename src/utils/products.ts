import type { Product } from "../types/product";

export const products: Product[] = [
  {
    id: "arduino-uno-r3",
    name: "Arduino Uno R3",
    slug: "arduino-uno-r3",
    category: "Arduino Boards",

    description:
      "Arduino Uno R3 development board suitable for electronics learning, prototyping, robotics and embedded projects.",

    shortDescription:
      "Popular Arduino development board for learning and prototyping.",

    price: 699,
    compareAtPrice: 799,
    currency: "INR",

    icon: "Cpu",

    stock: 25,
    featured: true,
    available: true,

    specifications: {
      Microcontroller: "ATmega328P",
      OperatingVoltage: "5V",
      DigitalPins: "14",
      AnalogInputs: "6",
      USB: "USB-B",
    },
  },

  {
    id: "esp32-development-board",
    name: "ESP32 Development Board",
    slug: "esp32-development-board",
    category: "Arduino Boards",

    description:
      "ESP32 development board with Wi-Fi and Bluetooth connectivity for IoT and embedded applications.",

    shortDescription:
      "Wi-Fi and Bluetooth development board for IoT projects.",

    price: 449,
    currency: "INR",

    icon: "Cpu",

    stock: 40,
    featured: true,
    available: true,

    specifications: {
      Processor: "ESP32",
      Connectivity: "Wi-Fi + Bluetooth",
      OperatingVoltage: "3.3V",
      USB: "Micro USB",
    },
  },

  {
    id: "ultrasonic-hc-sr04",
    name: "HC-SR04 Ultrasonic Sensor",
    slug: "hc-sr04-ultrasonic-sensor",
    category: "Sensors",

    description:
      "Ultrasonic distance sensor module suitable for robotics, obstacle detection and automation projects.",

    shortDescription:
      "Ultrasonic distance sensor for robotics and automation.",

    price: 79,
    currency: "INR",

    icon: "Radar",

    stock: 75,
    featured: true,
    available: true,

    specifications: {
      Voltage: "5V",
      Range: "2cm - 400cm",
      Type: "Ultrasonic",
      Interface: "Digital",
    },
  },

  {
    id: "dht11-temperature-humidity",
    name: "DHT11 Temperature & Humidity Sensor",
    slug: "dht11-temperature-humidity-sensor",
    category: "Sensors",

    description:
      "Digital temperature and humidity sensor module for weather stations, IoT and environmental monitoring.",

    shortDescription:
      "Affordable temperature and humidity sensor for IoT projects.",

    price: 99,
    currency: "INR",

    icon: "Radar",

    stock: 50,
    featured: false,
    available: true,

    specifications: {
      Voltage: "3.3V - 5V",
      Interface: "Digital",
      Temperature: "0°C - 50°C",
      Humidity: "20% - 90%",
    },
  },

  {
    id: "soldering-iron-kit",
    name: "Electronics Soldering Kit",
    slug: "electronics-soldering-kit",
    category: "Tools",

    description:
      "Essential soldering equipment for electronics assembly, prototyping, repair and hobby projects.",

    shortDescription:
      "Essential soldering tools for electronics work.",

    price: 899,
    currency: "INR",

    icon: "Wrench",

    stock: 15,
    featured: true,
    available: true,

    specifications: {
      Use: "Electronics",
      TemperatureControl: "Adjustable",
      Application: "Soldering & Repair",
    },
  },

  {
    id: "digital-multimeter",
    name: "Digital Multimeter",
    slug: "digital-multimeter",
    category: "Tools",

    description:
      "Digital multimeter for measuring voltage, current, resistance and other electrical parameters.",

    shortDescription:
      "Essential testing instrument for electronics and electrical work.",

    price: 599,
    currency: "INR",

    icon: "Wrench",

    stock: 20,
    featured: false,
    available: true,

    specifications: {
      Display: "Digital",
      Measurement: "Voltage, Current, Resistance",
      Application: "Electronics Testing",
    },
  },

  {
    id: "arduino-starter-kit",
    name: "Arduino Starter Kit",
    slug: "arduino-starter-kit",
    category: "Kits",

    description:
      "Beginner-friendly Arduino kit containing components required to start building electronics projects.",

    shortDescription:
      "Complete starter kit for learning Arduino and electronics.",

    price: 1499,
    currency: "INR",

    icon: "Package",

    stock: 12,
    featured: true,
    available: true,

    specifications: {
      Level: "Beginner",
      Platform: "Arduino",
      Application: "Learning & Prototyping",
    },
  },

  {
    id: "iot-development-kit",
    name: "IoT Development Kit",
    slug: "iot-development-kit",
    category: "Kits",

    description:
      "IoT-focused development kit for experimenting with sensors, connectivity and cloud-based projects.",

    shortDescription:
      "Development kit for IoT and connected-device projects.",

    price: 1999,
    currency: "INR",

    icon: "Package",

    stock: 8,
    featured: false,
    available: true,

    specifications: {
      Platform: "ESP32",
      Connectivity: "Wi-Fi",
      Application: "IoT",
    },
  },
];