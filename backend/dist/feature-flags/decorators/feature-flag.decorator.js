"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireFeature = exports.FEATURE_FLAG_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.FEATURE_FLAG_KEY = 'feature_flag';
const RequireFeature = (flagKey) => (0, common_1.SetMetadata)(exports.FEATURE_FLAG_KEY, flagKey);
exports.RequireFeature = RequireFeature;
//# sourceMappingURL=feature-flag.decorator.js.map