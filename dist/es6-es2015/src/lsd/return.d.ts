import { LSD } from "../parser/epub/lsd";
import { IDeviceIDManager } from "./deviceid-manager";
export declare function lsdReturn(lsdJSON: any, deviceIDManager: IDeviceIDManager): Promise<any>;
export declare function lsdReturn_(lsd: LSD, deviceIDManager: IDeviceIDManager): Promise<LSD>;
