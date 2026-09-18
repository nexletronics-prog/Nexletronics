import {
  Cpu,
  Package,
  Radar,
  Wrench,
} from "lucide-react";

export const shopCategories = [
  {
    id: "arduino-boards",
    name: "Arduino Boards",
    description:
      "Arduino and development boards for electronics, IoT, robotics and embedded projects.",
    icon: Cpu,
  },
  {
    id: "sensors",
    name: "Sensors",
    description:
      "Sensors and modules for measuring motion, distance, temperature, light and more.",
    icon: Radar,
  },
  {
    id: "tools",
    name: "Tools",
    description:
      "Soldering, testing, prototyping and electronics repair tools.",
    icon: Wrench,
  },
  {
    id: "kits",
    name: "Kits",
    description:
      "Electronics, robotics, IoT and educational kits for learning and building.",
    icon: Package,
  },
] as const;

export const serviceCategories = [
  {
    id: "3d-printing",
    name: "3D Printing",
    description:
      "Custom 3D printed parts, prototypes, enclosures and project components.",
  },
  {
    id: "custom-projects",
    name: "Custom Projects",
    description:
      "Custom electronics, IoT, robotics, automation and embedded projects.",
  },
  {
    id: "software",
    name: "Software",
    description:
      "Custom applications, dashboards, control systems and digital solutions.",
  },
] as const;