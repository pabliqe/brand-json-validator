/**
 * DTCG (Design Tokens Community Group) Schema Validator
 * Validates brand.json files against DTCG standard
 */

const DTCG_GROUPS = ['$schema', '$id', '$description', '$extensions', '$type'];
const DTCG_SCHEMA_URL = 'https://www.designtokens.org/tr/2025.10/format/';
const VALID_TOKEN_TYPES = [
  'color',
  'dimension',
  'number',
  'opacity',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'paragraphSpacing',
  'textCase',
  'textDecoration',
  'duration',
  'cubicBezier',
  'transition',
  'shadow',
  'gradient',
  'border',
  'borderRadius',
  'strokeStyle',
  'typography',
  'asset'
];

export class DTCGValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.structureIssues = [];
  }

  validate(json) {
    this.errors = [];
    this.warnings = [];
    this.structureIssues = [];

    if (!json || typeof json !== 'object') {
      this.errors.push({
        path: '$',
        message: 'Invalid JSON structure',
        severity: 'error',
        hint: 'The file must be valid JSON and be an object'
      });
      return { valid: false, errors: this.errors, warnings: this.warnings };
    }

    // Schema check
    if (!json.$schema) {
      this.warnings.push({
        path: '$.$schema',
        message: 'Missing $schema declaration',
        severity: 'warning',
        hint: `Add "$schema": "${DTCG_SCHEMA_URL}" to declare spec version`
      });
    } else if (json.$schema !== DTCG_SCHEMA_URL) {
      this.warnings.push({
        path: '$.$schema',
        message: `Unexpected $schema version (found ${json.$schema})`,
        severity: 'warning',
        hint: `Use ${DTCG_SCHEMA_URL} for the 2025.10 format`
      });
    }

    // Analyze structure issues FIRST (before validation)
    this.analyzeStructure(json);

    if (json.brand) {
      this.validateBrandMetadata(json.brand);
    }

    this.validateTokenGroups(json);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      structureIssues: this.structureIssues
    };
  }

  /**
   * Analyze DTCG structure and provide specific corrections
   */
  analyzeStructure(json) {
    for (const [key, value] of Object.entries(json)) {
      if (DTCG_GROUPS.includes(key) || key === 'brand') continue;

      if (typeof value === 'object' && value !== null) {
        this.analyzeTokenGroup(key, value);
      }
    }
  }

  /**
   * Analyze a token group for structure issues
   */
  analyzeTokenGroup(groupName, groupValue, path = '') {
    for (const [tokenName, token] of Object.entries(groupValue)) {
      if (tokenName.startsWith('$')) continue;

      if (typeof token === 'object' && token !== null) {
        const currentPath = path ? `${path}.${tokenName}` : tokenName;
        
        // Check if this looks like nested tokens (no value or $type)
        if (!('value' in token) && !('$type' in token)) {
          const nestedKeys = Object.keys(token).filter(k => !k.startsWith('$'));
          
          if (nestedKeys.length > 0) {
            // Check if children have values (nested structure)
            const hasNestedTokens = nestedKeys.some(k => {
              const child = token[k];
              return typeof child === 'object' && ('value' in child || '$type' in child);
            });

            if (hasNestedTokens) {
              // Generate flattened example
              const flattenedExample = this.generateFlattenedExample(groupName, currentPath, token);
              
              this.structureIssues.push({
                path: `$.${groupName}.${currentPath}`,
                issue: 'NESTED_TOKENS',
                message: `Nested token structure: "${currentPath}"`,
                description: `This contains ${nestedKeys.length} sub-token(s). DTCG recommends flat structure with naming conventions.`,
                suggestion: `Flatten to use hyphenated names like "${tokenName}-${nestedKeys[0]}"`,
                originalStructure: { [tokenName]: token },
                flattenedStructure: flattenedExample,
                nestedTokens: nestedKeys,
                fixType: 'flatten',
                autoFixable: true
              });
            } else {
              // Recurse deeper for nested groups
              this.analyzeTokenGroup(groupName, token, currentPath);
            }
          }
        }
      }
    }
  }

  validateBrandMetadata(brand) {
    if (typeof brand !== 'object') {
      this.errors.push({
        path: '$.brand',
        message: 'Brand metadata must be an object',
        severity: 'error',
        hint: 'brand should contain brand.name, brand.siteTitle, etc.'
      });
      return;
    }

    const requiredFields = ['name'];
    for (const field of requiredFields) {
      if (!brand[field]) {
        this.warnings.push({
          path: `$.brand.${field}`,
          message: `Missing brand.${field}`,
          severity: 'warning',
          hint: `Add brand.${field} to describe your brand`
        });
      }
    }
  }

  validateTokenGroups(json) {
    for (const [key, value] of Object.entries(json)) {
      if (DTCG_GROUPS.includes(key) || key === 'brand') continue;

      if (typeof value !== 'object') {
        this.errors.push({
          path: `$.${key}`,
          message: `Token group "${key}" must be an object`,
          severity: 'error',
          hint: `"${key}" should contain token definitions like { "primary": { "value": "#E00069" } }`
        });
        continue;
      }

      this.validateTokenGroup(key, value);
    }
  }

  validateTokenGroup(groupName, groupValue, parentPath = '') {
    for (const [tokenName, token] of Object.entries(groupValue)) {
      if (tokenName.startsWith('$')) {
        continue;
      }

      const currentPath = parentPath ? `${parentPath}.${tokenName}` : tokenName;

      if (typeof token !== 'object' || token === null) {
        this.errors.push({
          path: `$.${groupName}.${currentPath}`,
          message: `Token must be an object`,
          severity: 'error',
          hint: `Format: { "$value": "...", "$type": "color" }`
        });
        continue;
      }

      // If it doesn't have $value or value, it's a subgroup (recurse)
      // UNLESS it's an empty object, which we'll treat as a token missing value
      const hasTokenProps = '$value' in token || 'value' in token;
      const childKeys = Object.keys(token).filter(k => !k.startsWith('$'));
      
      if (!hasTokenProps && childKeys.length > 0) {
        // Recurse into subgroup
        this.validateTokenGroup(groupName, token, currentPath);
      } else {
        // Validate as token
        this.validateToken(groupName, tokenName, token, parentPath);
      }
    }
  }

  validateToken(groupName, tokenName, token, parentPath = '') {
    const fullPath = parentPath ? `${parentPath}.${tokenName}` : tokenName;
    
    if (!('$value' in token) && !('value' in token)) {
      // Check if this has nested properties that look like they should be flattened
      const keys = Object.keys(token).filter(k => !k.startsWith('$'));
      
      if (keys.length > 0) {
        // This looks like a nested structure - provide concrete example
        const exampleKey = keys[0];
        
        this.errors.push({
          path: `$.${groupName}.${fullPath}`,
          message: `Token missing "$value" property - has nested structure instead`,
          severity: 'error',
          hint: `This token has ${keys.length} nested properties (${keys.join(', ')}). Each should be a separate token.`,
          actualStructure: token,
          correctExample: this.generateCorrectStructure(tokenName, token),
          suggestion: `Flatten nested tokens or add "$value" property`
        });
      } else {
        this.errors.push({
          path: `$.${groupName}.${fullPath}`,
          message: `Token missing "$value" property`,
          severity: 'error',
          hint: `Add "$value": "..." to define the token value`
        });
      }
    }

    if ('value' in token && !('$value' in token)) {
      this.warnings.push({
        path: `$.${groupName}.${fullPath}.value`,
        message: 'Legacy "value" key used; prefer "$value" per DTCG 2025.10',
        severity: 'warning',
        hint: 'Rename "value" to "$value"'
      });
    }
    if ('type' in token && !('$type' in token)) {
      this.warnings.push({
        path: `$.${groupName}.${fullPath}.type`,
        message: 'Legacy "type" key used; prefer "$type" per DTCG 2025.10',
        severity: 'warning',
        hint: 'Rename "type" to "$type"'
      });
    }

    if (token.$type) {
      if (!VALID_TOKEN_TYPES.includes(token.$type)) {
        this.warnings.push({
          path: `$.${groupName}.${tokenName}.$type`,
          message: `Unknown token type: "${token.$type}"`,
          severity: 'warning',
          hint: `Valid types: ${VALID_TOKEN_TYPES.join(', ')}`
        });
      }
    } else if ('$value' in token || 'value' in token) {
      const val = token.$value || token.value;
      const inferredType = this.inferTokenType(val);
      if (inferredType) {
        this.warnings.push({
          path: `$.${groupName}.${tokenName}`,
          message: `Missing $type - inferred as "${inferredType}"`,
          severity: 'warning',
          hint: `Add "$type": "${inferredType}" for DTCG compliance`,
          suggestedFix: { $type: inferredType }
        });
      }
    }

    if (token.$type) {
      this.validateTokenValue(groupName, tokenName, token);
    }
  }

  validateTokenValue(groupName, tokenName, token) {
    const { $type } = token;
    const value = token.$value || token.value;

    switch ($type) {
      case 'color':
        this.validateColorValue(groupName, tokenName, value);
        break;
      case 'dimension':
        this.validateDimensionValue(groupName, tokenName, value);
        break;
      case 'number':
        this.validateNumberValue(groupName, tokenName, value);
        break;
      case 'opacity':
        this.validateOpacityValue(groupName, tokenName, value);
        break;
      case 'fontFamily':
        this.validateFontFamilyValue(groupName, tokenName, value);
        break;
      case 'fontSize':
      case 'fontWeight':
      case 'lineHeight':
      case 'letterSpacing':
      case 'paragraphSpacing':
        // These are dimensions; allow string/number/object handled by dimension validator when present
        this.validateDimensionValue(groupName, tokenName, value);
        break;
      case 'duration':
        this.validateDurationValue(groupName, tokenName, value);
        break;
      case 'borderRadius':
        this.validateBorderRadiusValue(groupName, tokenName, value);
        break;
      case 'textCase':
        this.validateTextCaseValue(groupName, tokenName, value);
        break;
      case 'textDecoration':
        this.validateTextDecorationValue(groupName, tokenName, value);
        break;
      case 'typography':
        this.validateTypographyValue(groupName, tokenName, value);
        break;
      case 'shadow':
        this.validateShadowValue(groupName, tokenName, value);
        break;
      case 'gradient':
        this.validateGradientValue(groupName, tokenName, value);
        break;
      case 'border':
        this.validateBorderValue(groupName, tokenName, value);
        break;
      case 'strokeStyle':
        this.validateStrokeStyleValue(groupName, tokenName, value);
        break;
      case 'transition':
        this.validateTransitionValue(groupName, tokenName, value);
        break;
      case 'cubicBezier':
        this.validateCubicBezierValue(groupName, tokenName, value);
        break;
    }
  }

  validateColorValue(groupName, tokenName, value) {
    // DTCG Color can be a string or a color object
    if (typeof value === 'object' && value !== null) {
      if (!value.colorSpace || !value.channels) {
        this.errors.push({
          path: `$.${groupName}.${tokenName}.$value`,
          message: `Invalid DTCG color object`,
          severity: 'error',
          hint: `DTCG color objects must have "colorSpace" and "channels"`
        });
      }
      return;
    }

    if (typeof value !== 'string') {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.value`,
        message: `Color value must be a string`,
        severity: 'error',
        hint: `Use hex (#E00069), rgb(), or color names`
      });
      return;
    }

    if (value.startsWith('#')) {
      if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{3})?$/.test(value)) {
        this.errors.push({
          path: `$.${groupName}.${tokenName}.value`,
          message: `Invalid hex color format`,
          severity: 'error',
          hint: `Use valid hex: #RGB, #RRGGBB, or #RRGGBBAA`
        });
      }
    }
  }

  validateDimensionValue(groupName, tokenName, value) {
    // DTCG Dimension can be a string or a dimension object
    if (typeof value === 'object' && value !== null) {
      if (value.value === undefined || value.unit === undefined) {
        this.errors.push({
          path: `$.${groupName}.${tokenName}.$value`,
          message: `Invalid DTCG dimension object`,
          severity: 'error',
          hint: `DTCG dimension objects must have "value" and "unit"`
        });
      }
      return;
    }

    if (typeof value !== 'string') {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.value`,
        message: `Dimension value must be a string`,
        severity: 'error',
        hint: `Use formats like "16px", "2rem", "100%"`
      });
      return;
    }

    if (!/^\d+(\.\d+)?(px|rem|em|%|vh|vw|vmin|vmax|pt|cm|mm|in|pc|ch)$/.test(value)) {
      this.warnings.push({
        path: `$.${groupName}.${tokenName}.value`,
        message: `Unusual dimension format`,
        severity: 'warning',
        hint: `Standard units: px, rem, em, %, vh, vw, pt, cm, mm, in, pc, ch`
      });
    }
  }

  validateFontFamilyValue(groupName, tokenName, value) {
    if (typeof value !== 'string') {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.value`,
        message: `Font family must be a string or array of strings`,
        severity: 'error',
        hint: `Use comma-separated font names or arrays: ["Inter", "sans-serif"]`
      });
    }
  }

  validateNumberValue(groupName, tokenName, value) {
    if (typeof value !== 'number') {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.$value`,
        message: 'Number token must have a numeric $value',
        severity: 'error',
        hint: 'Use a plain number (no unit)' 
      });
    }
  }

  validateOpacityValue(groupName, tokenName, value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.$value`,
        message: 'Opacity must be a number between 0 and 1',
        severity: 'error',
        hint: 'Example: 0.75' 
      });
    }
  }

  validateDurationValue(groupName, tokenName, value) {
    const isValid = (typeof value === 'number') || (typeof value === 'string' && /^-?[\d.]+(ms|s)$/.test(value));
    if (!isValid) {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.$value`,
        message: 'Duration must be number (ms) or string ending with ms/s',
        severity: 'error',
        hint: 'Examples: 250, "250ms", "0.2s"'
      });
    }
  }

  validateBorderRadiusValue(groupName, tokenName, value) {
    const check = (v) => typeof v === 'number' || (typeof v === 'string' && /^[\d.]+(px|rem|em|%)$/.test(v));
    if (!(check(value) || (typeof value === 'object' && value !== null && check(value.value)))) {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.$value`,
        message: 'Border radius must be a dimension (number or string with unit)',
        severity: 'error',
        hint: 'Examples: 4, "4px", { "value": 4, "unit": "px" }'
      });
    }
  }

  validateTextCaseValue(groupName, tokenName, value) {
    const allowed = ['none', 'uppercase', 'lowercase', 'capitalize'];
    if (typeof value !== 'string' || !allowed.includes(value)) {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.$value`,
        message: `textCase must be one of ${allowed.join(', ')}`,
        severity: 'error'
      });
    }
  }

  validateTextDecorationValue(groupName, tokenName, value) {
    const allowed = ['none', 'underline', 'line-through', 'overline'];
    if (typeof value !== 'string' || !allowed.includes(value)) {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.$value`,
        message: `textDecoration must be one of ${allowed.join(', ')}`,
        severity: 'error'
      });
    }
  }

  validateTypographyValue(groupName, tokenName, value) {
    if (typeof value !== 'object' || value === null) {
      this.errors.push({
        path: `$.${groupName}.${tokenName}.$value`,
        message: 'Typography must be an object',
        severity: 'error'
      });
      return;
    }
    const required = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'];
    for (const r of required) {
      if (!(r in value)) {
        this.errors.push({
          path: `$.${groupName}.${tokenName}.$value.${r}`,
          message: `Typography missing ${r}`,
          severity: 'error'
        });
      }
    }
    if ('letterSpacing' in value) this.validateDimensionValue(groupName, `${tokenName}.letterSpacing`, value.letterSpacing);
    if ('paragraphSpacing' in value) this.validateDimensionValue(groupName, `${tokenName}.paragraphSpacing`, value.paragraphSpacing);
    if ('textCase' in value) this.validateTextCaseValue(groupName, `${tokenName}.textCase`, value.textCase);
    if ('textDecoration' in value) this.validateTextDecorationValue(groupName, `${tokenName}.textDecoration`, value.textDecoration);
  }

  validateShadowValue(groupName, tokenName, value) {
    const shadows = Array.isArray(value) ? value : [value];
    for (const [idx, shadow] of shadows.entries()) {
      if (typeof shadow !== 'object' || shadow === null) {
        this.errors.push({ path: `$.${groupName}.${tokenName}.$value[${idx}]`, message: 'Shadow must be an object', severity: 'error' });
        continue;
      }
      const required = ['color', 'offsetX', 'offsetY', 'blur'];
      for (const r of required) {
        if (!(r in shadow)) {
          this.errors.push({ path: `$.${groupName}.${tokenName}.$value[${idx}].${r}`, message: 'Shadow missing field', severity: 'error' });
        }
      }
    }
  }

  validateGradientValue(groupName, tokenName, value) {
    if (typeof value !== 'object' || value === null) {
      this.errors.push({ path: `$.${groupName}.${tokenName}.$value`, message: 'Gradient must be an object', severity: 'error' });
      return;
    }
    if (!value.stops || !Array.isArray(value.stops) || value.stops.length === 0) {
      this.errors.push({ path: `$.${groupName}.${tokenName}.$value.stops`, message: 'Gradient requires stops', severity: 'error' });
    }
  }

  validateBorderValue(groupName, tokenName, value) {
    if (typeof value !== 'object' || value === null) {
      this.errors.push({ path: `$.${groupName}.${tokenName}.$value`, message: 'Border must be an object', severity: 'error' });
      return;
    }
    const required = ['color', 'width', 'style'];
    for (const r of required) {
      if (!(r in value)) {
        this.errors.push({ path: `$.${groupName}.${tokenName}.$value.${r}`, message: `Border missing ${r}`, severity: 'error' });
      }
    }
  }

  validateStrokeStyleValue(groupName, tokenName, value) {
    if (typeof value !== 'object' || value === null) {
      this.errors.push({ path: `$.${groupName}.${tokenName}.$value`, message: 'Stroke style must be an object', severity: 'error' });
      return;
    }
  }

  validateTransitionValue(groupName, tokenName, value) {
    if (typeof value !== 'object' || value === null) {
      this.errors.push({ path: `$.${groupName}.${tokenName}.$value`, message: 'Transition must be an object', severity: 'error' });
      return;
    }
    if (!value.duration) {
      this.errors.push({ path: `$.${groupName}.${tokenName}.$value.duration`, message: 'Transition missing duration', severity: 'error' });
    }
    if (value.timingFunction && value.timingFunction.$type !== 'cubicBezier') {
      this.warnings.push({ path: `$.${groupName}.${tokenName}.$value.timingFunction`, message: 'timingFunction should be a cubicBezier token', severity: 'warning' });
    }
  }

  validateCubicBezierValue(groupName, tokenName, value) {
    const arr = Array.isArray(value) ? value : value?.$value;
    if (!Array.isArray(arr) || arr.length !== 4 || arr.some(n => typeof n !== 'number')) {
      this.errors.push({ path: `$.${groupName}.${tokenName}.$value`, message: 'cubicBezier must be an array of four numbers', severity: 'error' });
    }
  }

  /**
   * Generate correct DTCG structure from nested object
   */
  generateCorrectStructure(tokenName, nestedObj) {
    const result = {};
    
    for (const [key, value] of Object.entries(nestedObj)) {
      if (key.startsWith('$')) continue;
      
      const flatKey = key === 'DEFAULT' ? tokenName : `${tokenName}-${key}`;
      
      if (typeof value === 'string' || typeof value === 'number') {
        // Direct value - create proper token
        const inferredType = this.inferTokenType(value);
        result[flatKey] = {
          value: value,
          ...(inferredType && { $type: inferredType })
        };
      } else if (typeof value === 'object' && value !== null) {
        // Nested object - recurse
        const nested = this.generateCorrectStructure(flatKey, value);
        Object.assign(result, nested);
      }
    }
    
    return result;
  }

  inferTokenType(value) {
    if (typeof value === 'string') {
      if (value.startsWith('#') || value.match(/^rgb/)) return 'color';
      if (value.match(/^\d+(\.\d+)?(px|rem|em|%|vh|vw|vmin|vmax|pt|cm|mm|in|pc|ch)$/)) return 'dimension';
      if (value.match(/^[-]?\d+(\.\d+)?(ms|s)$/)) return 'duration';
      if (value.match(/^\d+(\.\d+)?$/)) return parseFloat(value) <= 1 ? 'opacity' : 'number';
    }
    if (typeof value === 'number') return value <= 1 ? 'opacity' : 'number';
    return null;
  }

  /**
   * Generate example of flattened tokens
   */
  generateFlattenedExample(groupName, tokenPath, nestedObj) {
    const flattened = {};
    const baseName = tokenPath.split('.').pop(); // Get last part
    
    const flattenRecursive = (obj, prefix) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) {
          // Keep $type at group level if exists
          if (prefix === '') flattened[key] = value;
          continue;
        }
        
        if (typeof value === 'object' && value !== null) {
          if ('value' in value || '$type' in value) {
            // This is a token - flatten it
            const newKey = prefix ? `${prefix}-${key}` : key;
            flattened[newKey] = { ...value };
            
            // Infer $type if missing
            if (!flattened[newKey].$type && 'value' in value) {
              const inferredType = this.inferTokenType(value.value);
              if (inferredType) {
                flattened[newKey].$type = inferredType;
              }
            }
          } else {
            // Recurse deeper
            const newPrefix = prefix ? `${prefix}-${key}` : key;
            flattenRecursive(value, newPrefix);
          }
        }
      }
    };
    
    flattenRecursive(nestedObj, baseName);
    return flattened;
  }

  /**
   * Get all fixable issues with individual approve/disapprove capability
   */
  getFixableIssues(json) {
    const fixes = [];

    // Issue 1: Missing $type on tokens
    for (const groupName of Object.keys(json)) {
      if (DTCG_GROUPS.includes(groupName) || groupName === 'brand') continue;
      
      const group = json[groupName];
      if (typeof group !== 'object') continue;

      this.collectMissingTypes(group, groupName, '', fixes);
    }

    // Issue 2: Nested structures
    for (const issue of this.structureIssues) {
      if (issue.autoFixable) {
        fixes.push({
          id: `fix-${fixes.length}`,
          type: 'flatten',
          path: issue.path,
          description: issue.description,
          before: issue.originalStructure,
          after: issue.flattenedStructure,
          approved: false
        });
      }
    }

    return fixes;
  }

  /**
   * Collect all tokens missing $type
   */
  collectMissingTypes(obj, groupName, path, fixes) {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;
      
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        if ('value' in value && !('$type' in value)) {
          const inferredType = this.inferTokenType(value.value);
          if (inferredType) {
            fixes.push({
              id: `fix-${fixes.length}`,
              type: 'add-type',
              path: `$.${groupName}.${currentPath}`,
              description: `Add missing $type: "${inferredType}"`,
              before: { ...value },
              after: { ...value, $type: inferredType },
              approved: false
            });
          }
        } else if (!('value' in value) && !('$type' in value)) {
          // Recurse for nested groups
          this.collectMissingTypes(value, groupName, currentPath, fixes);
        }
      }
    }
  }

  /**
   * Apply approved fixes to JSON
   */
  applyApprovedFixes(json, fixes) {
    const result = JSON.parse(JSON.stringify(json));
    
    for (const fix of fixes) {
      if (!fix.approved) continue;

      if (fix.type === 'add-type') {
        const parts = fix.path.split('.').filter(p => p !== '$');
        let current = result;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) break;
          current = current[parts[i]];
        }
        
        const lastKey = parts[parts.length - 1];
        if (current && current[lastKey]) {
          current[lastKey].$type = fix.after.$type;
        }
      } else if (fix.type === 'flatten') {
        const parts = fix.path.split('.').filter(p => p !== '$');
        const groupName = parts[0];
        const tokenPath = parts.slice(1);
        
        if (result[groupName]) {
          let current = result[groupName];
          
          // Navigate to parent
          for (let i = 0; i < tokenPath.length - 1; i++) {
            if (!current[tokenPath[i]]) break;
            current = current[tokenPath[i]];
          }
          
          // Remove nested structure and add flattened tokens
          const lastKey = tokenPath[tokenPath.length - 1];
          if (current[lastKey]) {
            delete current[lastKey];
            
            // Add flattened tokens to group root
            Object.assign(result[groupName], fix.after);
          }
        }
      }
    }

    return result;
  }

  /**
   * Auto-fix common DTCG structure issues
   */
  autoFixStructure(json) {
    const fixed = JSON.parse(JSON.stringify(json));
    let fixed_count = 0;

    // Fix 1: Flatten nested tokens
    for (const groupName of Object.keys(fixed)) {
      if (DTCG_GROUPS.includes(groupName) || groupName === 'brand') continue;

      const group = fixed[groupName];
      if (typeof group !== 'object') continue;

      for (const [tokenName, token] of Object.entries(group)) {
        if (tokenName.startsWith('$')) continue;
        if (!('value' in token) && !('$type' in token) && typeof token === 'object') {
          // This is nested - flatten it
          const nestedKeys = Object.keys(token).filter(k => !k.startsWith('$'));
          for (const nestedKey of nestedKeys) {
            const nestedToken = token[nestedKey];
            if (typeof nestedToken === 'object' && nestedToken !== null) {
              const flatKey = `${tokenName}-${nestedKey}`;
              group[flatKey] = nestedToken;
              fixed_count++;
            }
          }
          delete group[tokenName];
        }
      }
    }

    // Fix 2: Add missing $type to all tokens
    for (const groupName of Object.keys(fixed)) {
      if (DTCG_GROUPS.includes(groupName) || groupName === 'brand') continue;

      const group = fixed[groupName];
      if (typeof group !== 'object') continue;

      for (const [tokenName, token] of Object.entries(group)) {
        if (tokenName.startsWith('$') || typeof token !== 'object') continue;
        if ('value' in token && !('$type' in token)) {
          const inferred = this.inferTokenType(token.value);
          if (inferred) {
            token.$type = inferred;
            fixed_count++;
          }
        }
      }
    }

    return { fixed, fixed_count };
  }

  getSuggestion(error) {
    if (error.message.includes('missing "value"')) {
      return 'Add a value property to complete the token definition';
    }
    if (error.message.includes('must be an object')) {
      return 'Wrap the content in curly braces: { }';
    }
    if (error.message.includes('Invalid hex color')) {
      return 'Check hex color format: #RGB or #RRGGBB';
    }
    return null;
  }

  // Auto-fix JSON: Convert to DTCG standard based on spec from designtokens.org
  autoFix(node, parentType = null) {
    if (typeof node !== 'object' || node === null) return node;
    if (Array.isArray(node)) return node.map(item => this.autoFix(item, parentType));
    
    // Check if this is a token (has value/$value) OR if it should be flattened
    const hasValue = 'value' in node;
    const hasDollarValue = '$value' in node;
    const hasType = 'type' in node;
    const hasDollarType = '$type' in node;

    // Handle flattening of DEFAULT/default/base/value nested tokens
    const keys = Object.keys(node).filter(k => !k.startsWith('$'));
    if (keys.length === 1 && !hasValue && !hasDollarValue) {
      const childKey = keys[0];
      if (['DEFAULT', 'default', 'base', 'value'].includes(childKey)) {
        const child = node[childKey];
        if (typeof child === 'string' || typeof child === 'number' || (typeof child === 'object' && child !== null)) {
          // Flatten this!
          const flattened = typeof child === 'object' ? child : { value: child };
          return this.autoFix(flattened, parentType);
        }
      }
    }
    
    // Case 1: Token (has some value property)
    if (hasValue || hasDollarValue) {
      let newNode = {};
      const val = hasDollarValue ? node.$value : node.value;
      const resolvedType = hasDollarType ? node.$type : (hasType ? node.type : (parentType || this.inferTokenType(val)));

      if (resolvedType === 'color' && typeof val === 'string') {
        newNode.$value = this.convertToColorObject(val);
      } else if (resolvedType === 'dimension' && typeof val === 'string') {
        newNode.$value = this.parseDimension(val);
      } else if ((resolvedType === 'number' || resolvedType === 'opacity') && typeof val === 'string' && /^-?[\d.]+$/.test(val)) {
        newNode.$value = parseFloat(val);
      } else {
        newNode.$value = val;
      }

      newNode.$type = resolvedType || (typeof val === 'number' ? 'number' : 'string');

      // Preserve description
      if (node.$description || node.description) {
        newNode.$description = node.$description || node.description;
      }

      // Preserve other $ properties
      Object.keys(node).filter(k => k.startsWith('$') && k !== '$value' && k !== '$type' && k !== '$description')
        .forEach(k => newNode[k] = node[k]);
        
      return newNode;
    }
    
    // Case 2: Group - recursively process children
    let newNode = {};
    const groupType = node.$type || parentType;
    
    for (const key in node) {
      if (key.startsWith('$')) {
        newNode[key] = node[key];
      } else {
        const child = node[key];
        // If the child is a primitive (string/number), convert it to a token object first
        if (child !== null && typeof child !== 'object') {
          newNode[key] = this.autoFix({ value: child }, groupType);
        } else {
          newNode[key] = this.autoFix(child, groupType);
        }
      }
    }
    
    return newNode;
  }
  
  // Helper: Convert hex color to DTCG color object
  convertToColorObject(hex) {
    if (typeof hex !== 'string') return hex;
    
    // Remove # and parse
    const cleanHex = hex.replace('#', '');
    let r, g, b;
    
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
      g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
      b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
    } else if (cleanHex.length === 4) { // #RGBA
      r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
      g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
      b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
      // We could handle alpha too
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substr(0, 2), 16) / 255;
      g = parseInt(cleanHex.substr(2, 2), 16) / 255;
      b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    } else if (cleanHex.length === 8) { // #RRGGBBAA
      r = parseInt(cleanHex.substr(0, 2), 16) / 255;
      g = parseInt(cleanHex.substr(2, 2), 16) / 255;
      b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    } else {
      return hex; // Invalid, return as-is
    }
    
    return {
      colorSpace: 'srgb',
      channels: {
        r: Math.round(r * 1000) / 1000,
        g: Math.round(g * 1000) / 1000,
        b: Math.round(b * 1000) / 1000,
        a: 1
      }
    };
  }
  
  // Helper: Parse color strings like "rgb(255, 0, 0)"
  parseColorString(colorStr) {
    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      return {
        colorSpace: 'srgb',
        channels: {
          r: parseInt(rgbMatch[1]) / 255,
          g: parseInt(rgbMatch[2]) / 255,
          b: parseInt(rgbMatch[3]) / 255,
          a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
        }
      };
    }
    return colorStr; // Can't parse, return as-is
  }
  
  // Helper: Parse dimension strings like "16px"
  parseDimension(dimStr) {
    const match = dimStr.match(/([\d.]+)(px|rem|em|%|vh|vw|vmin|vmax|pt|cm|mm|in|pc|ch)/);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2]
      };
    }
    return dimStr; // Can't parse, return as-is
  }
}
