/**
 * WebHID API Type Declarations
 * https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API
 */

interface HIDDevice extends EventTarget {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  collections: HIDCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
  addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface HIDInputReportEvent extends Event {
  device: HIDDevice;
  reportId: number;
  data: DataView;
}

interface HIDCollectionInfo {
  usagePage: number;
  usage: number;
  type: number;
  children: HIDCollectionInfo[];
  inputReports: HIDReportInfo[];
  outputReports: HIDReportInfo[];
  featureReports: HIDReportInfo[];
}

interface HIDReportInfo {
  reportId: number;
  items: HIDReportItem[];
}

interface HIDReportItem {
  isAbsolute: boolean;
  isArray: boolean;
  isBufferedBytes: boolean;
  isConstant: boolean;
  isLinear: boolean;
  isRange: boolean;
  isVolatile: boolean;
  hasNull: boolean;
  hasPreferredState: boolean;
  wrap: boolean;
  usages: number[];
  usageMinimum: number;
  usageMaximum: number;
  reportSize: number;
  reportCount: number;
  unitExponent: number;
  unitSystem: string;
  unitFactorLengthExponent: number;
  unitFactorMassExponent: number;
  unitFactorTimeExponent: number;
  unitFactorTemperatureExponent: number;
  unitFactorCurrentExponent: number;
  unitFactorLuminousIntensityExponent: number;
  logicalMinimum: number;
  logicalMaximum: number;
  physicalMinimum: number;
  physicalMaximum: number;
  strings: string[];
}

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
  addEventListener(type: 'connect' | 'disconnect', listener: (event: HIDConnectionEvent) => void): void;
  removeEventListener(type: 'connect' | 'disconnect', listener: (event: HIDConnectionEvent) => void): void;
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice;
}

interface Navigator {
  hid: HID;
}
