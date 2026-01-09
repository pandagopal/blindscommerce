'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ZoomIn, ArrowLeft, Check, Info, Sparkles, Shield, Truck, Calendar, ShoppingCart, User, ChevronDown, ChevronUp, Sun, Moon, Eye, EyeOff, AlertTriangle, Lightbulb, Baby, Zap, Search, X, Filter } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

// Default room types as fallback (sorted alphabetically)
const DEFAULT_ROOM_TYPES = [
  'Basement',
  'Bathroom',
  'Bedroom',
  'Dining Room',
  'Garage',
  'Home Office',
  'Kitchen',
  'Living Room',
  'Media Room',
  'Nursery',
  'Patio/Outdoor',
  'Sunroom',
];

// Opacity filter options
const OPACITY_FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'sheer', label: 'Sheer', icon: Sun, description: 'Maximum light, minimal privacy' },
  { id: 'light-filtering', label: 'Light Filtering', icon: Eye, description: 'Soft light, moderate privacy' },
  { id: 'room-darkening', label: 'Room Darkening', icon: EyeOff, description: 'Reduced light, good privacy' },
  { id: 'blackout', label: 'Blackout', icon: Moon, description: 'No light, maximum privacy' },
];

// Smart recommendation types
interface Recommendation {
  type: 'info' | 'warning' | 'suggestion';
  icon: any;
  title: string;
  message: string;
  action?: {
    label: string;
    value: string;
    field: string;
  };
}

interface ProductConfiguratorProps {
  product: any;
  slug: string;
  onAddToCart: (config: any, price: number) => void;
  initialConfig?: any;
  isEditMode?: boolean;
  userRole?: string;
  roomTypes?: string[];
}

// Collapsible Section Component
const CollapsibleSection = ({
  id,
  title,
  isRequired,
  isCompleted,
  isExpanded,
  onToggle,
  completedSummary,
  children,
  recommendations = []
}: {
  id: string;
  title: string;
  isRequired?: boolean;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  completedSummary?: string;
  children: React.ReactNode;
  recommendations?: Recommendation[];
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border transition-all duration-300 ${
      isExpanded ? 'border-primary-red shadow-red-100' : isCompleted ? 'border-green-200' : 'border-gray-100'
    }`}>
      {/* Section Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center space-x-3">
          {/* Completion Indicator */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {isCompleted ? <Check size={16} /> : <span className="text-sm font-medium">{id}</span>}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              {title}
              {isRequired && <span className="text-red-500 text-sm font-normal ml-2">*</span>}
            </h2>
            {/* Show summary when collapsed and completed */}
            {!isExpanded && isCompleted && completedSummary && (
              <p className="text-sm text-green-600 mt-0.5">{completedSummary}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Recommendation badge */}
          {recommendations.length > 0 && !isExpanded && (
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center">
              <Lightbulb size={12} className="mr-1" />
              {recommendations.length} tip{recommendations.length > 1 ? 's' : ''}
            </span>
          )}

          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-500" />
          ) : (
            <ChevronDown size={20} className="text-gray-500" />
          )}
        </div>
      </button>

      {/* Section Content - Collapsible */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 pb-4">
          {/* Smart Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-4 space-y-2">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start space-x-3 ${
                    rec.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                    rec.type === 'suggestion' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <rec.icon size={18} className={`mt-0.5 flex-shrink-0 ${
                    rec.type === 'warning' ? 'text-amber-600' :
                    rec.type === 'suggestion' ? 'text-primary-red' :
                    'text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      rec.type === 'warning' ? 'text-amber-800' :
                      rec.type === 'suggestion' ? 'text-primary-dark' :
                      'text-gray-800'
                    }`}>{rec.title}</p>
                    <p className={`text-xs mt-0.5 ${
                      rec.type === 'warning' ? 'text-amber-700' :
                      rec.type === 'suggestion' ? 'text-primary-red' :
                      'text-gray-600'
                    }`}>{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

// Opacity Indicator Component
const OpacityIndicator = ({ opacity }: { opacity?: string }) => {
  const getOpacityLevel = (opacityValue: string | undefined) => {
    if (!opacityValue) return 2;
    const lower = opacityValue.toLowerCase();
    if (lower.includes('blackout')) return 4;
    if (lower.includes('room-darkening') || lower.includes('room darkening')) return 3;
    if (lower.includes('light-filtering') || lower.includes('light filtering')) return 2;
    if (lower.includes('sheer')) return 1;
    return 2;
  };

  const level = getOpacityLevel(opacity);

  return (
    <div className="flex items-center space-x-1" title={opacity || 'Light Filtering'}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-3 rounded-sm transition-colors ${
            i <= level ? 'bg-gray-800' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export default function NewProductConfigurator({ product, slug, onAddToCart, initialConfig = {}, isEditMode = false, userRole, roomTypes = [] }: ProductConfiguratorProps) {
  // Use passed roomTypes or fallback to defaults
  const availableRoomTypes = roomTypes.length > 0 ? roomTypes : DEFAULT_ROOM_TYPES;
  const { itemCount } = useCart();
  const [showZoom, setShowZoom] = useState(false);

  // Accordion state - track which section is expanded
  const [expandedSection, setExpandedSection] = useState<string>('1');

  // Fabric filter states
  const [fabricSearch, setFabricSearch] = useState('');
  const [opacityFilter, setOpacityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [config, setConfig] = useState({
    roomType: initialConfig.roomType || '',
    mountType: initialConfig.mountType || '',
    systemType: initialConfig.systemType || '',
    width: initialConfig.width || '',
    height: initialConfig.height || '',
    widthFraction: initialConfig.widthFraction || '0',
    heightFraction: initialConfig.heightFraction || '0',
    fabricType: initialConfig.fabricType || '',
    fabricOption: initialConfig.fabricOption || '',
    colorOption: initialConfig.colorOption || '',
    liftSystem: initialConfig.liftSystem || '',
    controlOption: initialConfig.controlOption || initialConfig.controlType || '',
    valanceOption: initialConfig.valanceOption || '',
    bottomRailOption: initialConfig.bottomRailOption || '',
  });

  const [errors, setErrors] = useState({
    roomType: '',
    mountType: '',
    width: '',
    height: '',
    fabricType: '',
    colorOption: '',
    controlOption: '',
    liftSystem: '',
    valanceOption: '',
    bottomRailOption: '',
  });

  const [activeFabricType, setActiveFabricType] = useState<string>('');

  // Group fabrics by type
  const fabricTypes = useMemo(() => {
    if (!product?.fabricOptions) return [];

    const groupedFabrics = product.fabricOptions.reduce((acc: Record<string, any[]>, fabric: any) => {
      const type = fabric.fabric_type || 'Standard';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(fabric);
      return acc;
    }, {});

    return Object.keys(groupedFabrics).map(type => ({
      type,
      fabrics: groupedFabrics[type]
    }));
  }, [product?.fabricOptions]);

  // Filter fabrics based on search and opacity
  const filteredFabrics = useMemo(() => {
    const currentTypeFabrics = fabricTypes.find(ft => ft.type === activeFabricType)?.fabrics || [];

    return currentTypeFabrics.filter((fabric: any) => {
      // Search filter
      const matchesSearch = !fabricSearch ||
        fabric.fabric_name?.toLowerCase().includes(fabricSearch.toLowerCase()) ||
        fabric.fabric_code?.toLowerCase().includes(fabricSearch.toLowerCase());

      // Opacity filter
      const matchesOpacity = opacityFilter === 'all' ||
        fabric.opacity?.toLowerCase().includes(opacityFilter.replace('-', ' '));

      return matchesSearch && matchesOpacity;
    });
  }, [fabricTypes, activeFabricType, fabricSearch, opacityFilter]);

  // Initialize active fabric type
  useEffect(() => {
    if (fabricTypes.length > 0 && !activeFabricType) {
      if (initialConfig.fabricType) {
        const selectedFabric = product?.fabricOptions?.find(
          (f: any) => f.fabric_option_id?.toString() === initialConfig.fabricType ||
               f.id?.toString() === initialConfig.fabricType
        );

        if (selectedFabric) {
          setActiveFabricType(selectedFabric.fabric_type || 'Standard');
        } else {
          setActiveFabricType(fabricTypes[0].type);
        }
      } else {
        setActiveFabricType(fabricTypes[0].type);
      }
    }
  }, [fabricTypes, activeFabricType, initialConfig.fabricType, product?.fabricOptions]);

  // Validate initial configuration
  useEffect(() => {
    if (product && config.width && config.height) {
      const mandatoryErrors = validateMandatoryFields();
      setErrors(mandatoryErrors);
    }
  }, [product]);

  // Auto-expand next section when current is completed
  useEffect(() => {
    const sectionOrder = ['1', '2', '3', '4', '5', '6'];
    const completionMap: Record<string, boolean> = {
      '1': !!config.roomType,
      '2': !!config.mountType,
      '3': !!config.width && !!config.height && !errors.width && !errors.height,
      '4': !!config.fabricType,
      '5': !!config.controlOption,
      '6': !!config.valanceOption && !!config.bottomRailOption,
    };

    // Find first incomplete section
    for (const section of sectionOrder) {
      if (!completionMap[section]) {
        // Only auto-expand if current section is completed
        const currentIndex = sectionOrder.indexOf(expandedSection);
        const targetIndex = sectionOrder.indexOf(section);
        if (targetIndex === currentIndex + 1 && completionMap[expandedSection]) {
          setExpandedSection(section);
        }
        break;
      }
    }
  }, [config, errors.width, errors.height]);

  // Smart Recommendations based on current configuration
  const getRecommendations = (sectionId: string): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    const totalWidth = parseFloat(config.width) + parseFloat(config.widthFraction || '0');
    const totalHeight = parseFloat(config.height) + parseFloat(config.heightFraction || '0');

    switch (sectionId) {
      case '1': // Room Type
        if (config.roomType === 'Nursery' || config.roomType === 'Kids Room') {
          recommendations.push({
            type: 'suggestion',
            icon: Baby,
            title: 'Child Safety Recommended',
            message: 'For nurseries and kids rooms, we recommend cordless or motorized options for enhanced child safety.',
          });
        }
        if (config.roomType === 'Bedroom' || config.roomType === 'Media Room') {
          recommendations.push({
            type: 'suggestion',
            icon: Moon,
            title: 'Blackout Fabrics Recommended',
            message: 'Consider blackout fabrics for better sleep quality and reduced screen glare.',
          });
        }
        break;

      case '2': // Mount Type
        if (config.mountType === 'inside') {
          recommendations.push({
            type: 'info',
            icon: Info,
            title: 'Light Gaps Expected',
            message: 'Inside mount will have small light gaps (~1/4" to 1/2") around edges. For complete darkness, consider outside mount.',
          });
        }
        break;

      case '3': // Dimensions
        if (totalWidth > 72) {
          recommendations.push({
            type: 'suggestion',
            icon: Zap,
            title: 'Motorized Recommended',
            message: 'For wide blinds (over 72"), motorized control makes operation easier and extends product life.',
          });
        }
        if (totalHeight > 84) {
          recommendations.push({
            type: 'warning',
            icon: AlertTriangle,
            title: 'Heavy Blind Warning',
            message: 'Tall blinds may be heavier. Ensure proper mounting hardware and consider professional installation.',
          });
        }
        if (totalWidth > 0 && totalHeight > 0 && (totalWidth < 24 || totalHeight < 24)) {
          recommendations.push({
            type: 'info',
            icon: Info,
            title: 'Small Window',
            message: 'For small windows, cordless options provide a cleaner look without dangling cords.',
          });
        }
        break;

      case '4': // Fabric
        if (config.roomType === 'Bathroom' || config.roomType === 'Kitchen') {
          recommendations.push({
            type: 'suggestion',
            icon: Lightbulb,
            title: 'Moisture-Resistant Fabrics',
            message: 'For humid areas, look for fabrics labeled as moisture-resistant or easy-clean.',
          });
        }
        if (config.roomType === 'Sunroom' || config.roomType === 'Patio/Outdoor') {
          recommendations.push({
            type: 'suggestion',
            icon: Sun,
            title: 'UV-Resistant Fabrics',
            message: 'High-sun areas benefit from UV-resistant fabrics that won\'t fade over time.',
          });
        }
        break;

      case '5': // Control Options
        if ((config.roomType === 'Nursery' || config.roomType === 'Kids Room') &&
            !config.controlOption?.includes('cordless') && !config.controlOption?.includes('motor')) {
          recommendations.push({
            type: 'warning',
            icon: Baby,
            title: 'Child Safety Alert',
            message: 'Corded blinds pose a strangulation hazard. Cordless or motorized options are strongly recommended for child safety.',
          });
        }
        if (totalWidth > 72 && !config.controlOption?.includes('motor')) {
          recommendations.push({
            type: 'suggestion',
            icon: Zap,
            title: 'Consider Motorized',
            message: 'Your blind width suggests motorized control would be more convenient for daily use.',
          });
        }
        break;
    }

    return recommendations;
  };

  const handleRoomTypeChange = (roomType: string) => {
    setConfig(prev => ({ ...prev, roomType }));
    setErrors(prev => ({ ...prev, roomType: '' }));
  };

  const handleMountTypeChange = (mountType: string) => {
    setConfig(prev => ({ ...prev, mountType }));
    setErrors(prev => ({ ...prev, mountType: '' }));
  };

  const validateDimension = (value: string, type: 'width' | 'height') => {
    const numValue = parseFloat(value);

    if (!value || isNaN(numValue) || numValue <= 0) {
      return `Please enter valid ${type}`;
    }

    const dimensions = product?.dimensions || {};
    const minWidth = dimensions?.minWidth || product?.custom_width_min || 12;
    const maxWidth = dimensions?.maxWidth || product?.custom_width_max || 96;
    const minHeight = dimensions?.minHeight || product?.custom_height_min || 12;
    const maxHeight = dimensions?.maxHeight || product?.custom_height_max || 120;

    let totalValue = numValue;
    if (type === 'width') {
      const widthFraction = parseFloat(config.widthFraction) || 0;
      totalValue = numValue + widthFraction;

      if (totalValue < minWidth) {
        return `Width must be at least ${minWidth} inches`;
      }
      if (totalValue > maxWidth) {
        return `Width must be at most ${maxWidth} inches`;
      }
    } else if (type === 'height') {
      const heightFraction = parseFloat(config.heightFraction) || 0;
      totalValue = numValue + heightFraction;

      if (totalValue < minHeight) {
        return `Height must be at least ${minHeight} inches`;
      }
      if (totalValue > maxHeight) {
        return `Height must be at most ${maxHeight} inches`;
      }
    }

    return '';
  };

  const handleDimensionChange = (field: 'width' | 'height', value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));

    const dimensions = product?.dimensions || {};
    const maxWidth = dimensions?.maxWidth || product?.custom_width_max || 96;
    const maxHeight = dimensions?.maxHeight || product?.custom_height_max || 120;

    const numValue = parseFloat(value);
    if (field === 'width' && maxWidth && numValue >= maxWidth) {
      setConfig(prev => ({ ...prev, widthFraction: '0' }));
    }
    if (field === 'height' && maxHeight && numValue >= maxHeight) {
      setConfig(prev => ({ ...prev, heightFraction: '0' }));
    }

    const error = validateDimension(value, field);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const isWidthEighthsDisabled = () => {
    const dimensions = product?.dimensions || {};
    const maxWidth = dimensions?.maxWidth || product?.custom_width_max || 96;
    const currentWidth = parseFloat(config.width);
    return maxWidth && currentWidth >= maxWidth;
  };

  const isHeightEighthsDisabled = () => {
    const dimensions = product?.dimensions || {};
    const maxHeight = dimensions?.maxHeight || product?.custom_height_max || 120;
    const currentHeight = parseFloat(config.height);
    return maxHeight && currentHeight >= maxHeight;
  };

  const validateMandatoryFields = () => {
    const hasRailOptions = (product?.controlTypes?.valanceOptions?.filter((o: any) => o.enabled).length > 0) ||
                          (product?.controlTypes?.bottomRailOptions?.filter((o: any) => o.enabled).length > 0);

    return {
      roomType: !config.roomType ? 'Please select a room type' : '',
      mountType: !config.mountType ? 'Please select mount type' : '',
      width: !config.width ? 'Please enter width' : validateDimension(config.width, 'width'),
      height: !config.height ? 'Please enter height' : validateDimension(config.height, 'height'),
      fabricType: !config.fabricType ? 'Please select a fabric' : '',
      colorOption: '',
      controlOption: !config.controlOption ? 'Please select a control option' : '',
      liftSystem: '',
      valanceOption: hasRailOptions && !config.valanceOption ? 'Please select a valance option' : '',
      bottomRailOption: hasRailOptions && !config.bottomRailOption ? 'Please select a bottom rail option' : '',
    };
  };

  const validateForm = () => {
    const allErrors = validateMandatoryFields();
    setErrors(allErrors);
    return !Object.values(allErrors).some(error => error !== '');
  };

  const areMandatoryFieldsComplete = () => {
    const mandatoryErrors = validateMandatoryFields();
    return !Object.values(mandatoryErrors).some(error => error !== '');
  };

  const handleAddToCart = () => {
    if (validateForm()) {
      const calculatedPrice = calculatePrice();
      onAddToCart(config, calculatedPrice);
    }
  };

  const calculatePrice = () => {
    const width = parseFloat(config.width) || 0;
    const height = parseFloat(config.height) || 0;
    const widthFraction = parseFloat(config.widthFraction) || 0;
    const heightFraction = parseFloat(config.heightFraction) || 0;

    const totalWidth = width + widthFraction;
    const totalHeight = height + heightFraction;
    const area = totalWidth * totalHeight;
    const areaInSqFt = area / 144;

    if (product?.pricing_model === 'per_square' && product?.price_per_square) {
      const minSquares = product.min_squares || 1;
      const effectiveArea = Math.max(areaInSqFt, minSquares);
      let totalPrice = effectiveArea * parseFloat(product.price_per_square);

      if (config.controlOption && config.controlOption.includes('motor')) {
        totalPrice += parseFloat(product.add_on_motor) || 0;
      }

      return totalPrice;
    }

    let totalPrice = parseFloat(product?.base_price) || 0;

    if (product?.pricingMatrix && totalWidth > 0 && totalHeight > 0) {
      const selectedFabric = product?.fabricOptions?.find((f: any) =>
        f.fabric_option_id?.toString() === config.fabricType
      );

      const matrixPrice = product.pricingMatrix.find((matrix: any) => {
        const matchesDimensions = totalWidth >= matrix.width_min &&
                                totalWidth <= matrix.width_max &&
                                totalHeight >= matrix.height_min &&
                                totalHeight <= matrix.height_max;

        const matchesSystem = !config.systemType ||
                            matrix.system_type === config.systemType ||
                            (!matrix.system_type && !config.systemType);

        const matchesFabric = !selectedFabric ||
                            !matrix.fabric_code ||
                            matrix.fabric_code === selectedFabric?.fabric_code;

        return matchesDimensions && matchesSystem && matchesFabric;
      });

      if (matrixPrice) {
        totalPrice += parseFloat(matrixPrice.base_price) || 0;
        if (matrixPrice.price_per_sqft > 0) {
          totalPrice += areaInSqFt * parseFloat(matrixPrice.price_per_sqft);
        }
      } else if (product?.pricing_formulas) {
        const formula = product.pricing_formulas.find((f: any) =>
          (!config.systemType || f.system_type === config.systemType) &&
          (!selectedFabric || !f.fabric_code || f.fabric_code === selectedFabric?.fabric_code)
        );

        if (formula) {
          const formulaPrice = parseFloat(formula.fixed_base || 0) +
                             (parseFloat(formula.width_rate || 0) * totalWidth) +
                             (parseFloat(formula.height_rate || 0) * totalHeight) +
                             (parseFloat(formula.area_rate || 0) * totalWidth * totalHeight);

          totalPrice = Math.max(formulaPrice, parseFloat(formula.min_charge || 0));
        }
      }
    }

    if (config.fabricType) {
      const selectedFabric = product?.fabricOptions?.find((f: any) => f.fabric_option_id?.toString() === config.fabricType);
      if (selectedFabric) {
        const fabricPricing = product?.fabricPricing?.find((p: any) => p.fabric_option_id === selectedFabric.fabric_option_id);
        if (fabricPricing && fabricPricing.price_per_sqft) {
          totalPrice += areaInSqFt * parseFloat(fabricPricing.price_per_sqft);
        }
      }
    }

    if (config.controlOption && product?.controlTypes) {
      const allControlTypes = [
        ...(product.controlTypes.liftSystems || []),
        ...(product.controlTypes.wandSystem || []),
        ...(product.controlTypes.stringSystem || []),
        ...(product.controlTypes.remoteControl || [])
      ];

      const selectedControl = allControlTypes.find((control: any) =>
        control.name.toLowerCase().replace(/\s+/g, '-') === config.controlOption
      );

      if (selectedControl && selectedControl.enabled) {
        totalPrice += parseFloat(selectedControl.price_adjustment) || 0;
      }
    }

    if (config.valanceOption && product?.controlTypes?.valanceOptions) {
      const selectedValance = product.controlTypes.valanceOptions.find((valance: any) =>
        valance.name.toLowerCase().replace(/\s+/g, '-') === config.valanceOption
      );

      if (selectedValance && selectedValance.enabled) {
        totalPrice += parseFloat(selectedValance.price_adjustment) || 0;
      }
    }

    if (config.bottomRailOption && product?.controlTypes?.bottomRailOptions) {
      const selectedBottomRail = product.controlTypes.bottomRailOptions.find((rail: any) =>
        rail.name.toLowerCase().replace(/\s+/g, '-') === config.bottomRailOption
      );

      if (selectedBottomRail && selectedBottomRail.enabled) {
        totalPrice += parseFloat(selectedBottomRail.price_adjustment) || 0;
      }
    }

    return isNaN(totalPrice) ? 0 : totalPrice;
  };

  const isStepCompleted = (step: string) => {
    switch (step) {
      case '1': return !!config.roomType;
      case '2': return !!config.mountType;
      case '3': return !!config.width && !!config.height && !errors.width && !errors.height;
      case '4': return !!config.fabricType;
      case '5': return !!config.controlOption;
      case '6': return !!config.valanceOption && !!config.bottomRailOption;
      default: return false;
    }
  };

  const getCompletedSummary = (step: string) => {
    switch (step) {
      case '1': return config.roomType;
      case '2': return config.mountType === 'inside' ? 'Inside Mount' : 'Outside Mount';
      case '3':
        const w = parseFloat(config.width) + parseFloat(config.widthFraction || '0');
        const h = parseFloat(config.height) + parseFloat(config.heightFraction || '0');
        return `${w}" W × ${h}" H`;
      case '4':
        const fabric = product?.fabricOptions?.find((f: any) => f.fabric_option_id?.toString() === config.fabricType);
        return fabric?.fabric_name || '';
      case '5': return config.controlOption?.replace(/-/g, ' ');
      case '6': return `${config.valanceOption?.replace(/-/g, ' ')} / ${config.bottomRailOption?.replace(/-/g, ' ')}`;
      default: return '';
    }
  };

  const getBgClass = (fabricType: string | undefined) => {
    switch(fabricType?.toLowerCase()) {
      case 'sheer': return 'from-gray-100 to-gray-200';
      case 'blackout': return 'from-gray-800 to-gray-900';
      case 'colored': return 'from-red-100 to-red-200';
      case 'woven': return 'from-amber-100 to-amber-200';
      case 'natural': return 'from-green-100 to-green-200';
      case 'designer': return 'from-purple-100 to-purple-200';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  // Check if rail options section should be shown
  const hasRailOptions = (product?.controlTypes?.valanceOptions?.filter((o: any) => o.enabled).length > 0) ||
                        (product?.controlTypes?.bottomRailOptions?.filter((o: any) => o.enabled).length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-4">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-primary-red hover:text-primary-dark transition-colors text-sm font-medium group"
          >
            <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">
          {/* Left Side - Configuration */}
          <div className="space-y-3 lg:h-auto">

            {/* Section 1: Room Type */}
            <CollapsibleSection
              id="1"
              title="Choose Your Room"
              isRequired
              isCompleted={isStepCompleted('1')}
              isExpanded={expandedSection === '1'}
              onToggle={() => setExpandedSection(expandedSection === '1' ? '' : '1')}
              completedSummary={getCompletedSummary('1')}
              recommendations={getRecommendations('1')}
            >
              <select
                value={config.roomType}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red transition-all text-gray-700 ${
                  errors.roomType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select room type</option>
                {availableRoomTypes.map((roomType: string) => (
                  <option key={roomType} value={roomType}>
                    {roomType}
                  </option>
                ))}
              </select>
              {errors.roomType && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.roomType}
                </p>
              )}
            </CollapsibleSection>

            {/* Section 2: Mount Type */}
            <CollapsibleSection
              id="2"
              title="Choose Mount Type"
              isRequired
              isCompleted={isStepCompleted('2')}
              isExpanded={expandedSection === '2'}
              onToggle={() => setExpandedSection(expandedSection === '2' ? '' : '2')}
              completedSummary={getCompletedSummary('2')}
              recommendations={getRecommendations('2')}
            >
              <div className="space-y-2">
                {/* Inside Mount */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    config.mountType === 'inside'
                      ? 'border-primary-red bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMountTypeChange('inside')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="w-10 h-10 bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-gray-900">Inside Mount</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Fits within the window frame. Clean look with small light gaps (~1/4").
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      config.mountType === 'inside' ? 'border-primary-red bg-red-500' : 'border-gray-300'
                    }`}>
                      {config.mountType === 'inside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </div>

                {/* Outside Mount */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    config.mountType === 'outside'
                      ? 'border-primary-red bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMountTypeChange('outside')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="w-12 h-10 bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-gray-900">Outside Mount</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Mounts above/around frame. Better light blocking, covers imperfections.
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      config.mountType === 'outside' ? 'border-primary-red bg-red-500' : 'border-gray-300'
                    }`}>
                      {config.mountType === 'outside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </div>
              </div>

              {errors.mountType && (
                <p className="text-red-500 text-sm mt-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.mountType}
                </p>
              )}
            </CollapsibleSection>

            {/* Section 3: Dimensions */}
            <CollapsibleSection
              id="3"
              title="Enter Size"
              isRequired
              isCompleted={isStepCompleted('3')}
              isExpanded={expandedSection === '3'}
              onToggle={() => setExpandedSection(expandedSection === '3' ? '' : '3')}
              completedSummary={getCompletedSummary('3')}
              recommendations={getRecommendations('3')}
            >
              <div className="space-y-4">
                <div className="flex space-x-4">
                  {/* Window illustration */}
                  <div className="hidden sm:flex items-center justify-center">
                    <div className="w-20 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-lg p-2">
                      <div className="w-full h-full bg-white rounded shadow-inner grid grid-cols-2 grid-rows-2">
                        <div className="border-r border-b border-gray-200"></div>
                        <div className="border-b border-gray-200"></div>
                        <div className="border-r border-gray-200"></div>
                        <div></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width (inches)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={config.width}
                          onChange={(e) => handleDimensionChange('width', e.target.value)}
                          placeholder="0"
                          className={`w-24 p-2 border rounded-lg focus:ring-2 focus:ring-primary-red ${
                            errors.width ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        <select
                          value={config.widthFraction}
                          onChange={(e) => setConfig(prev => ({ ...prev, widthFraction: e.target.value }))}
                          disabled={isWidthEighthsDisabled()}
                          className="w-20 p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="0">0</option>
                          <option value="0.125">1/8</option>
                          <option value="0.25">1/4</option>
                          <option value="0.375">3/8</option>
                          <option value="0.5">1/2</option>
                          <option value="0.625">5/8</option>
                          <option value="0.75">3/4</option>
                          <option value="0.875">7/8</option>
                        </select>
                      </div>
                      {errors.width && <p className="text-red-500 text-xs mt-1">{errors.width}</p>}
                    </div>

                    {/* Height */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={config.height}
                          onChange={(e) => handleDimensionChange('height', e.target.value)}
                          placeholder="0"
                          className={`w-24 p-2 border rounded-lg focus:ring-2 focus:ring-primary-red ${
                            errors.height ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        <select
                          value={config.heightFraction}
                          onChange={(e) => setConfig(prev => ({ ...prev, heightFraction: e.target.value }))}
                          disabled={isHeightEighthsDisabled()}
                          className="w-20 p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="0">0</option>
                          <option value="0.125">1/8</option>
                          <option value="0.25">1/4</option>
                          <option value="0.375">3/8</option>
                          <option value="0.5">1/2</option>
                          <option value="0.625">5/8</option>
                          <option value="0.75">3/4</option>
                          <option value="0.875">7/8</option>
                        </select>
                      </div>
                      {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 4: Fabric Selection - Enhanced */}
            <CollapsibleSection
              id="4"
              title="Choose Fabric"
              isRequired
              isCompleted={isStepCompleted('4')}
              isExpanded={expandedSection === '4'}
              onToggle={() => setExpandedSection(expandedSection === '4' ? '' : '4')}
              completedSummary={getCompletedSummary('4')}
              recommendations={getRecommendations('4')}
            >
              {fabricTypes.length > 0 ? (
                <div className="space-y-4">
                  {/* Search and Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={fabricSearch}
                        onChange={(e) => setFabricSearch(e.target.value)}
                        placeholder="Search fabrics..."
                        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red text-sm"
                      />
                      {fabricSearch && (
                        <button
                          onClick={() => setFabricSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        showFilters || opacityFilter !== 'all'
                          ? 'bg-red-50 border-red-300 text-primary-red'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Filter size={16} className="mr-2" />
                      Filters
                      {opacityFilter !== 'all' && (
                        <span className="ml-2 bg-primary-red text-white text-xs px-1.5 py-0.5 rounded">1</span>
                      )}
                    </button>
                  </div>

                  {/* Opacity Filter Pills */}
                  {showFilters && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">Light Control</p>
                      <div className="flex flex-wrap gap-2">
                        {OPACITY_FILTERS.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setOpacityFilter(filter.id)}
                            className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              opacityFilter === filter.id
                                ? 'bg-primary-red text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:border-red-300'
                            }`}
                            title={filter.description}
                          >
                            {filter.icon && <filter.icon size={12} className="mr-1.5" />}
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fabric Type Tabs */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                    {fabricTypes.map((fabricTypeGroup) => (
                      <button
                        key={fabricTypeGroup.type}
                        onClick={() => setActiveFabricType(fabricTypeGroup.type)}
                        className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-all capitalize ${
                          activeFabricType === fabricTypeGroup.type
                            ? 'bg-white text-primary-red shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {fabricTypeGroup.type} ({fabricTypeGroup.fabrics.length})
                      </button>
                    ))}
                  </div>

                  {/* Fabric Grid with Enhanced Cards */}
                  {filteredFabrics.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredFabrics.map((fabric: any) => (
                        <div
                          key={fabric.fabric_option_id}
                          className={`cursor-pointer transition-all hover:scale-[1.02] group ${
                            config.fabricType === fabric.fabric_option_id.toString()
                              ? 'ring-2 ring-primary-red ring-offset-2 rounded-lg'
                              : ''
                          }`}
                          onClick={() => {
                            setConfig(prev => ({ ...prev, fabricType: fabric.fabric_option_id.toString() }));
                            setErrors(prev => ({ ...prev, fabricType: '' }));
                          }}
                        >
                          <div className="space-y-2">
                            {/* Fabric Image with Opacity Badge */}
                            <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                              config.fabricType === fabric.fabric_option_id.toString()
                                ? 'border-primary-red'
                                : 'border-gray-200 group-hover:border-gray-300'
                            }`}>
                              {fabric.fabric_image_url ? (
                                <img
                                  src={fabric.fabric_image_url}
                                  alt={fabric.fabric_name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${getBgClass(fabric.fabric_type)} flex items-center justify-center`}>
                                  <div className="w-3/4 h-3/4 bg-white/80 rounded shadow-sm"></div>
                                </div>
                              )}

                              {/* Opacity Badge */}
                              {fabric.opacity && (
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5">
                                  <OpacityIndicator opacity={fabric.opacity} />
                                </div>
                              )}

                              {/* Selection Check */}
                              {config.fabricType === fabric.fabric_option_id.toString() && (
                                <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
                                  <Check size={12} className="text-white" />
                                </div>
                              )}
                            </div>

                            {/* Fabric Name & Info */}
                            <div className="px-1">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {fabric.fabric_name}
                              </p>
                              {fabric.opacity && (
                                <p className="text-[10px] text-gray-500 capitalize truncate">
                                  {fabric.opacity}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Search size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No fabrics match your filters</p>
                      <button
                        onClick={() => {
                          setFabricSearch('');
                          setOpacityFilter('all');
                        }}
                        className="text-primary-red text-sm mt-2 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No fabric options available for this product.</p>
                </div>
              )}

              {errors.fabricType && (
                <p className="text-red-500 text-sm mt-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.fabricType}
                </p>
              )}
            </CollapsibleSection>

            {/* Section 5: Control Options */}
            <CollapsibleSection
              id="5"
              title="Choose Control Option"
              isRequired
              isCompleted={isStepCompleted('5')}
              isExpanded={expandedSection === '5'}
              onToggle={() => setExpandedSection(expandedSection === '5' ? '' : '5')}
              completedSummary={getCompletedSummary('5')}
              recommendations={getRecommendations('5')}
            >
              {product?.controlTypes ? (
                <div className="space-y-3">
                  {/* Lift Systems */}
                  {product.controlTypes.liftSystems?.some((s: any) => s.enabled) && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Lift Systems</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.controlTypes.liftSystems
                          .filter((system: any) => system.enabled)
                          .map((system: any) => {
                            const controlId = system.name.toLowerCase().replace(/\s+/g, '-');
                            const isChildSafe = system.name.toLowerCase().includes('cordless') ||
                                               system.name.toLowerCase().includes('motor');
                            return (
                              <label
                                key={controlId}
                                className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                  config.controlOption === controlId
                                    ? 'border-primary-red bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="controlOption"
                                  value={controlId}
                                  checked={config.controlOption === controlId}
                                  onChange={(e) => {
                                    setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                                    setErrors(prev => ({ ...prev, controlOption: '' }));
                                  }}
                                  className="mt-0.5 text-primary-red focus:ring-primary-red"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center">
                                    <h4 className="text-sm font-medium text-gray-900">{system.name}</h4>
                                    {isChildSafe && (
                                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                                        <Baby size={10} className="mr-0.5" />
                                        Child Safe
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {system.name.includes('Cordless') ? 'Push up/down to operate' :
                                     system.name.includes('Motor') ? 'Remote or app controlled' :
                                     'Chain/cord operation'}
                                  </p>
                                  <p className="text-xs text-primary-red font-medium mt-1">
                                    {system.price_adjustment === 0 ? 'Included' : `+$${system.price_adjustment}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Other control types with same pattern */}
                  {product.controlTypes.wandSystem?.some((s: any) => s.enabled) && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Wand System</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.controlTypes.wandSystem
                          .filter((system: any) => system.enabled)
                          .map((system: any) => {
                            const controlId = system.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <label key={controlId} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                                config.controlOption === controlId ? 'border-primary-red bg-red-50' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <input
                                  type="radio"
                                  name="controlOption"
                                  value={controlId}
                                  checked={config.controlOption === controlId}
                                  onChange={(e) => {
                                    setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                                    setErrors(prev => ({ ...prev, controlOption: '' }));
                                  }}
                                  className="mt-0.5 text-primary-red"
                                />
                                <div className="ml-3">
                                  <h4 className="text-sm font-medium text-gray-900">{system.name}</h4>
                                  <p className="text-xs text-primary-red font-medium mt-1">
                                    {system.price_adjustment === 0 ? 'Included' : `+$${system.price_adjustment}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {product.controlTypes.remoteControl?.some((s: any) => s.enabled) && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Remote Control</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.controlTypes.remoteControl
                          .filter((system: any) => system.enabled)
                          .map((system: any) => {
                            const controlId = system.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <label key={controlId} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                                config.controlOption === controlId ? 'border-primary-red bg-red-50' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <input
                                  type="radio"
                                  name="controlOption"
                                  value={controlId}
                                  checked={config.controlOption === controlId}
                                  onChange={(e) => {
                                    setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                                    setErrors(prev => ({ ...prev, controlOption: '' }));
                                  }}
                                  className="mt-0.5 text-primary-red"
                                />
                                <div className="ml-3">
                                  <h4 className="text-sm font-medium text-gray-900">{system.name}</h4>
                                  <p className="text-xs text-primary-red font-medium mt-1">
                                    {system.price_adjustment === 0 ? 'Included' : `+$${system.price_adjustment}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No control options available.</p>
                </div>
              )}

              {errors.controlOption && (
                <p className="text-red-500 text-sm mt-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.controlOption}
                </p>
              )}
            </CollapsibleSection>

            {/* Section 6: Rail Options */}
            {hasRailOptions && (
              <CollapsibleSection
                id="6"
                title="Rail Options"
                isRequired
                isCompleted={isStepCompleted('6')}
                isExpanded={expandedSection === '6'}
                onToggle={() => setExpandedSection(expandedSection === '6' ? '' : '6')}
                completedSummary={getCompletedSummary('6')}
                recommendations={[]}
              >
                <div className="space-y-4">
                  {/* Valance Options */}
                  {product?.controlTypes?.valanceOptions?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valance (Head Rail)</label>
                      <select
                        value={config.valanceOption}
                        onChange={(e) => {
                          setConfig(prev => ({ ...prev, valanceOption: e.target.value }));
                          setErrors(prev => ({ ...prev, valanceOption: '' }));
                        }}
                        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-red ${
                          errors.valanceOption ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select valance option</option>
                        {product.controlTypes.valanceOptions
                          .filter((option: any) => option.enabled)
                          .map((option: any) => (
                            <option key={option.name} value={option.name.toLowerCase().replace(/\s+/g, '-')}>
                              {option.name} {option.price_adjustment > 0 ? `(+$${option.price_adjustment})` : ''}
                            </option>
                          ))}
                      </select>
                      {errors.valanceOption && (
                        <p className="text-red-500 text-sm mt-1">{errors.valanceOption}</p>
                      )}
                    </div>
                  )}

                  {/* Bottom Rail Options */}
                  {product?.controlTypes?.bottomRailOptions?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Rail</label>
                      <select
                        value={config.bottomRailOption}
                        onChange={(e) => {
                          setConfig(prev => ({ ...prev, bottomRailOption: e.target.value }));
                          setErrors(prev => ({ ...prev, bottomRailOption: '' }));
                        }}
                        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-red ${
                          errors.bottomRailOption ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select bottom rail option</option>
                        {product.controlTypes.bottomRailOptions
                          .filter((option: any) => option.enabled)
                          .map((option: any) => (
                            <option key={option.name} value={option.name.toLowerCase().replace(/\s+/g, '-')}>
                              {option.name} {option.price_adjustment > 0 ? `(+$${option.price_adjustment})` : ''}
                            </option>
                          ))}
                      </select>
                      {errors.bottomRailOption && (
                        <p className="text-red-500 text-sm mt-1">{errors.bottomRailOption}</p>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 md:space-y-0 md:flex md:gap-2">
              {userRole === 'customer' ? (
                <button
                  onClick={handleAddToCart}
                  disabled={!areMandatoryFieldsComplete()}
                  className={`w-full md:flex-1 font-semibold py-3 px-5 rounded-lg transition-all shadow-lg flex items-center justify-center ${
                    areMandatoryFieldsComplete()
                      ? 'bg-primary-red hover:bg-primary-dark text-white hover:shadow-xl cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={18} className="mr-2" />
                  {areMandatoryFieldsComplete()
                    ? isEditMode
                      ? `Update Cart - $${calculatePrice().toFixed(2)}`
                      : `Add to Cart - $${calculatePrice().toFixed(2)}`
                    : 'Complete All Sections'
                  }
                </button>
              ) : !userRole ? (
                <div className="w-full md:flex-1 bg-yellow-50 border border-yellow-200 rounded-lg py-3 px-5 text-center">
                  <p className="text-yellow-800 font-medium mb-2">Please log in to add items to cart</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center bg-primary-red hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg"
                  >
                    <User size={16} className="mr-2" />
                    Log In to Continue
                  </Link>
                </div>
              ) : (
                <div className="w-full md:flex-1 bg-gray-100 border border-gray-300 rounded-lg py-3 px-5 text-center">
                  <p className="text-gray-600 font-medium">Only customers can add items to cart</p>
                </div>
              )}

              {userRole === 'customer' && (
                <Link href="/cart" className="block w-full md:w-auto">
                  <button className="w-full md:w-auto font-semibold py-3 px-5 rounded-lg border-2 border-gray-300 hover:border-primary-red text-gray-700 hover:text-primary-red flex items-center justify-center">
                    <ShoppingCart size={16} className="mr-2" />
                    View Cart
                    {itemCount > 0 && (
                      <span className="ml-2 bg-primary-red text-white text-xs rounded-full px-2 py-1">({itemCount})</span>
                    )}
                  </button>
                </Link>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <Shield className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">100% Secure</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <Truck className="w-6 h-6 text-primary-red mx-auto mb-1" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Quick Delivery</p>
              </div>
            </div>
          </div>

          {/* Right Side - Product Preview */}
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto space-y-3">
            {/* Header Card with Progress */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center mb-3">
                <Sparkles className="text-primary-red mr-2" size={20} />
                <h1 className="text-lg font-bold text-gray-900">Configure Your Perfect Blind</h1>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Configuration Progress</span>
                  <span>
                    {[isStepCompleted('1'), isStepCompleted('2'), isStepCompleted('3'),
                      isStepCompleted('4'), isStepCompleted('5'),
                      !hasRailOptions || isStepCompleted('6')].filter(Boolean).length} of {hasRailOptions ? 6 : 5} complete
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-red to-green-500 transition-all duration-500"
                    style={{
                      width: `${([isStepCompleted('1'), isStepCompleted('2'), isStepCompleted('3'),
                        isStepCompleted('4'), isStepCompleted('5'),
                        !hasRailOptions || isStepCompleted('6')].filter(Boolean).length / (hasRailOptions ? 6 : 5)) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Mini Steps */}
              <div className="flex items-center justify-between">
                {['Room', 'Mount', 'Size', 'Fabric', 'Control', ...(hasRailOptions ? ['Rails'] : [])].map((step, index) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                      isStepCompleted(String(index + 1))
                        ? 'bg-green-500 text-white'
                        : expandedSection === String(index + 1)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isStepCompleted(String(index + 1)) ? <Check size={12} /> : index + 1}
                    </div>
                    <span className="text-[10px] mt-1 text-gray-500">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Preview Card */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{product?.name || 'Premium Roller Shades'}</h2>
                  <p className="text-sm text-gray-500">
                    {config.fabricType && product?.fabricOptions ?
                      product.fabricOptions.find((f: any) => f.fabric_option_id?.toString() === config.fabricType)?.fabric_name || 'Select a fabric'
                      : 'Select a fabric'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${calculatePrice().toFixed(2)}</div>
                  <div className="text-xs text-gray-500">including options</div>
                </div>
              </div>

              {/* Product Image */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl overflow-hidden" style={{ height: '300px' }}>
                <button
                  onClick={() => setShowZoom(true)}
                  className="absolute top-3 right-3 z-10 bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center shadow hover:bg-white"
                >
                  <ZoomIn size={14} className="mr-1" />
                  Zoom
                </button>

                {(() => {
                  if (config.fabricType && product?.fabricOptions) {
                    const selectedFabric = product.fabricOptions.find(
                      (f: any) => f.fabric_option_id?.toString() === config.fabricType
                    );
                    if (selectedFabric?.fabric_image_url) {
                      return (
                        <div className="w-full h-full bg-cover bg-center"
                             style={{ backgroundImage: `url(${selectedFabric.fabric_image_url})` }} />
                      );
                    }
                  }

                  if (product?.images?.[0]?.image_url) {
                    return (
                      <div className="w-full h-full bg-cover bg-center"
                           style={{ backgroundImage: `url(${product.images[0].image_url})` }} />
                    );
                  }

                  return (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-5xl mb-2">🏠</div>
                        <p className="text-sm">Select fabric to preview</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Configuration Summary */}
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900 mb-2">Your Selections</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {config.roomType && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Room:</span>
                      <span className="font-medium">{config.roomType}</span>
                    </div>
                  )}
                  {config.mountType && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mount:</span>
                      <span className="font-medium capitalize">{config.mountType}</span>
                    </div>
                  )}
                  {config.width && config.height && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">
                        {parseFloat(config.width) + parseFloat(config.widthFraction || '0')}" × {parseFloat(config.height) + parseFloat(config.heightFraction || '0')}"
                      </span>
                    </div>
                  )}
                  {config.controlOption && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Control:</span>
                      <span className="font-medium capitalize">{config.controlOption.replace(/-/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {showZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowZoom(false)} />
          <div className="relative z-10 max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{product?.name || 'Product Preview'}</h3>
              <button onClick={() => setShowZoom(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-gray-50" style={{ height: '70vh' }}>
              {(() => {
                let imageUrl = null;
                if (config.fabricType && product?.fabricOptions) {
                  const selectedFabric = product.fabricOptions.find(
                    (f: any) => f.fabric_option_id?.toString() === config.fabricType
                  );
                  imageUrl = selectedFabric?.fabric_image_url;
                }
                if (!imageUrl && product?.images?.[0]?.image_url) {
                  imageUrl = product.images[0].image_url;
                }

                return imageUrl ? (
                  <img src={imageUrl} alt={product?.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <p>No image available</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
