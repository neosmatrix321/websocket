var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "reflect-metadata", "inversify", "../global/EventHandlingMixin"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SERVER_WRAPPER_TOKEN = void 0;
    require("reflect-metadata");
    var inversify_1 = require("inversify");
    var eH = __importStar(require("../global/EventHandlingMixin"));
    var BaseServerEvent = /** @class */ (function () {
        function BaseServerEvent() {
            this["cat"] = eH.catType.server;
        }
        return BaseServerEvent;
    }());
    var serverWrapper = /** @class */ (function (_super) {
        __extends(serverWrapper, _super);
        function serverWrapper(server) {
            var _this = _super.call(this) || this;
            _this._server = server || {
                _handle: {
                    web: null,
                    file: null
                },
                _stats: {
                    dummy: 0
                },
                _settings: {
                    certPath: '/etc/letsencrypt/live/neo.dnsfor.me/cert.pem',
                    keyPath: '/etc/letsencrypt/live/neo.dnsfor.me/privkey.pem',
                    ip: "192.168.228.7",
                    rconPort: 25575,
                    streamServerPort: 8080
                }
            };
            return _this;
        }
        serverWrapper.prototype.killAll = function () {
            console.log('no please!');
        };
        serverWrapper = __decorate([
            (0, inversify_1.injectable)(),
            __param(0, (0, inversify_1.inject)(exports.SERVER_WRAPPER_TOKEN)),
            __param(0, (0, inversify_1.optional)()),
            __metadata("design:paramtypes", [Object])
        ], serverWrapper);
        return serverWrapper;
    }(eH.EventEmitterMixin(BaseServerEvent)));
    exports.default = serverWrapper;
    exports.SERVER_WRAPPER_TOKEN = Symbol('ServerService');
});
