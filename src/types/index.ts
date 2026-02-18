// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ContentType {
  POST_PROCESSOR = 'POST_PROCESSOR',
  MACHINE_SCHEMA = 'MACHINE_SCHEMA',
  INTERPRETER = 'INTERPRETER',
  DIGITAL_MACHINE_KIT = 'DIGITAL_MACHINE_KIT',
}

export enum ContentCategory {
  CNC_MACHINES = 'CNC_MACHINES',
  ROBOTS = 'ROBOTS',
}

export enum MachineType {
  MILLING = 'MILLING',
  TURNING = 'TURNING',
  MILL_TURN = 'MILL_TURN',
  WIRE_EDM = 'WIRE_EDM',
  LASER = 'LASER',
  PLASMA = 'PLASMA',
  WATERJET = 'WATERJET',
  GRINDING = 'GRINDING',
  ROBOT = 'ROBOT',
  OTHER = 'OTHER',
}

export enum PublicationStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export enum ExperienceStatus {
  NOT_TESTED = 'NOT_TESTED',
  VERIFIED_ON_EQUIPMENT = 'VERIFIED_ON_EQUIPMENT',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  DEALER = 'DEALER',
  DEALERS = 'DEALERS',
  VENDOR = 'VENDOR',
}

export enum UserRole {
  USER = 'USER',
  DEALER = 'DEALER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

// ─── Models ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  contentType: ContentType;
  category: ContentCategory;
  description: string;
  kitContents: string;
  minSoftwareVersion: string;
  machineManufacturer: string;
  machineSeries: string;
  machineModel: string;
  machineType: MachineType;
  numberOfAxes: number;
  controllerManufacturer: string;
  controllerSeries: string;
  controllerModel: string;
  priceEur: number;
  productOwner: string;
  authorName: string;
  trialDays: number;
  supportedCodes: string;
  sampleOutputCode: string;
  imageUrl: string;
  publicationStatus: PublicationStatus;
  experienceStatus: ExperienceStatus;
  visibility: Visibility;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface AuthUser {
  userId: number;
  username: string;
  role: UserRole;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SearchRequest {
  query?: string;
  category?: ContentCategory;
  contentType?: ContentType;
  machineType?: MachineType;
  machineManufacturer?: string;
  controllerManufacturer?: string;
  numberOfAxes?: number;
  contentOwner?: string;
  page?: number;
  size?: number;
}

export interface SearchResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FilterOptions {
  machineManufacturers: string[];
  controllerManufacturers: string[];
  contentOwners: string[];
  numberOfAxes: number[];
  contentTypes: string[];
  machineTypes: string[];
  categories: string[];
}

export interface License {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  type: string;
  expiresAt: string;
  createdAt: string;
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export const contentTypeLabels: Record<ContentType, string> = {
  [ContentType.POST_PROCESSOR]: 'Post Processor',
  [ContentType.MACHINE_SCHEMA]: 'Machine Schema',
  [ContentType.INTERPRETER]: 'Interpreter',
  [ContentType.DIGITAL_MACHINE_KIT]: 'Digital Machine Kit',
};

export const categoryLabels: Record<ContentCategory, string> = {
  [ContentCategory.CNC_MACHINES]: 'CNC Machines',
  [ContentCategory.ROBOTS]: 'Robots',
};

export const machineTypeLabels: Record<MachineType, string> = {
  [MachineType.MILLING]: 'Milling',
  [MachineType.TURNING]: 'Turning',
  [MachineType.MILL_TURN]: 'Mill-Turn',
  [MachineType.WIRE_EDM]: 'Wire EDM',
  [MachineType.LASER]: 'Laser',
  [MachineType.PLASMA]: 'Plasma',
  [MachineType.WATERJET]: 'Waterjet',
  [MachineType.GRINDING]: 'Grinding',
  [MachineType.ROBOT]: 'Robot',
  [MachineType.OTHER]: 'Other',
};

export const publicationStatusLabels: Record<PublicationStatus, string> = {
  [PublicationStatus.DRAFT]: 'Draft',
  [PublicationStatus.PENDING_REVIEW]: 'Pending Review',
  [PublicationStatus.PUBLISHED]: 'Published',
  [PublicationStatus.REJECTED]: 'Rejected',
};

export const contentTypeColors: Record<ContentType, string> = {
  [ContentType.POST_PROCESSOR]: '#2196f3',
  [ContentType.MACHINE_SCHEMA]: '#4caf50',
  [ContentType.INTERPRETER]: '#ff9800',
  [ContentType.DIGITAL_MACHINE_KIT]: '#9c27b0',
};

export const statusColors: Record<PublicationStatus, string> = {
  [PublicationStatus.DRAFT]: '#9e9e9e',
  [PublicationStatus.PENDING_REVIEW]: '#ff9800',
  [PublicationStatus.PUBLISHED]: '#4caf50',
  [PublicationStatus.REJECTED]: '#f44336',
};
