import { LSD } from "../parser/epub/lsd";
import { IDeviceIDManager } from "./deviceid-manager";
export declare function lsdRegister(lsdJSON: any, deviceIDManager: IDeviceIDManager): Promise<any>;
export declare function lsdRegister_(lsd: LSD, deviceIDManager: IDeviceIDManager): Promise<LSD>;
