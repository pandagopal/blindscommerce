'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface ConfigurationOption {
  option_id: number;
  option_name: string;
  option_type: string;
  is_required: boolean;
  display_order: number;
  help_text?: string;
  validation_rules?: any;
  values: OptionValue[];
}

interface OptionValue {
  value_id: number;
  value_name: string;
  value_data?: string;
  price_modifier: number;
  display_order: number;
  is_default: boolean;
  is_available: boolean;
  image_url?: string;
  description?: string;
}

interface ConfigurationStep {
  step_id: number;
  step_name: string;
  step_title: string;
  step_description?: string;
  step_order: number;
  is_required: boolean;
  validation_rules?: any;
  help_content?: string;
  options: ConfigurationOption[];
}

interface ConfigurationRule {
  rule_id: number;
  rule_name: string;
  rule_type: string;
  condition_data: any;
  action_data: any;
  priority: number;
  is_active: boolean;
}

interface Color {
  id: number;
  color_name: string;
  color_code?: string;
  color_family?: string;
  price_adjustment: number;
  is_available: boolean;
  swatch_image?: string;
  display_order: number;
}

interface Material {
  id: number;
  material_name: string;
  material_type?: string;
  description?: string;
  price_adjustment: number;
  durability_rating?: number;
  maintenance_level: string;
  is_eco_friendly: boolean;
  is_available: boolean;
  sample_available: boolean;
  texture_image?: string;
}

interface PricingInfo {
  id: number;
  width_min: number;
  width_max: number;
  height_min: number;
  height_max: number;
  base_price: number;
  price_per_sqft: number;
  is_active: boolean;
}

interface ConfigurationData {
  product: any;
  steps: ConfigurationStep[];
  rules: ConfigurationRule[];
  colors: Color[];
  materials: Material[];
  pricing?: PricingInfo;
  roomRecommendations: any[];
  specifications: any[];
}

interface ConfigState {
  // Current configuration values (option_id -> value_id)
  selectedOptions: Record<number, number>;
  
  // Dimensions
  width: number;
  height: number;
  
  // Current step
  currentStep: number;
  
  // Pricing
  basePrice: number;
  optionModifiers: number;
  ruleModifiers: number;
  totalPrice: number;
  
  // Validation
  validationErrors: Record<string, string>;
  isValid: boolean;
  
  // UI State
  loading: boolean;
  calculating: boolean;
  
  // Configuration data
  configurationData?: ConfigurationData;
}

type ConfigAction =
  | { type: 'SET_CONFIGURATION_DATA'; payload: ConfigurationData }
  | { type: 'SET_OPTION'; payload: { optionId: number; valueId: number } }
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_PRICING'; payload: { basePrice: number; optionModifiers: number; ruleModifiers: number; totalPrice: number } }
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_VALIDATION_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CALCULATING'; payload: boolean }
  | { type: 'RESET_CONFIGURATION' };

const initialState: ConfigState = {
  selectedOptions: {},
  width: 24,
  height: 36,
  currentStep: 0,
  basePrice: 0,
  optionModifiers: 0,
  ruleModifiers: 0,
  totalPrice: 0,
  validationErrors: {},
  isValid: false,
  loading: true,
  calculating: false,
  configurationData: undefined
};

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case 'SET_CONFIGURATION_DATA':
      return {
        ...state,
        configurationData: action.payload,
        loading: false,
        basePrice: action.payload.product?.base_price || 0,
        totalPrice: action.payload.product?.base_price || 0
      };
      
    case 'SET_OPTION':
      const newSelectedOptions = {
        ...state.selectedOptions,
        [action.payload.optionId]: action.payload.valueId
      };
      return {
        ...state,
        selectedOptions: newSelectedOptions
      };
      
    case 'SET_DIMENSIONS':
      return {
        ...state,
        width: action.payload.width,
        height: action.payload.height
      };
      
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload
      };
      
    case 'SET_PRICING':
      return {
        ...state,
        basePrice: action.payload.basePrice,
        optionModifiers: action.payload.optionModifiers,
        ruleModifiers: action.payload.ruleModifiers,
        totalPrice: action.payload.totalPrice,
        calculating: false
      };
      
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.payload.field]: action.payload.error
        },
        isValid: false
      };
      
    case 'CLEAR_VALIDATION_ERROR':
      const newErrors = { ...state.validationErrors };
      delete newErrors[action.payload];
      return {
        ...state,
        validationErrors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
      
    case 'SET_CALCULATING':
      return {
        ...state,
        calculating: action.payload
      };
      
    case 'RESET_CONFIGURATION':
      return {
        ...initialState,
        configurationData: state.configurationData,
        loading: false
      };
      
    default:
      return state;
  }
}

interface ConfigurationContextType {
  state: ConfigState;
  dispatch: React.Dispatch<ConfigAction>;
  
  // Helper functions
  setOption: (optionId: number, valueId: number) => void;
  setDimensions: (width: number, height: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  calculatePrice: () => Promise<void>;
  validateCurrentStep: () => boolean;
  resetConfiguration: () => void;
  
  // Getters
  getCurrentStep: () => ConfigurationStep | undefined;
  getSelectedOptionValue: (optionId: number) => OptionValue | undefined;
  getOptionByName: (name: string) => ConfigurationOption | undefined;
  getApplicableRules: () => ConfigurationRule[];
}

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

export function DynamicConfigurationProvider({ 
  children, 
  productSlug 
}: { 
  children: React.ReactNode;
  productSlug: string;
}) {
  const [state, dispatch] = useReducer(configReducer, initialState);

  // Load configuration data on mount
  useEffect(() => {
    loadConfigurationData();
  }, [productSlug]);

  // Calculate price when configuration changes
  useEffect(() => {
    if (state.configurationData && (Object.keys(state.selectedOptions).length > 0 || state.width !== 24 || state.height !== 36)) {
      calculatePrice();
    }
  }, [state.selectedOptions, state.width, state.height]);

  const loadConfigurationData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`/api/products/${productSlug}/configuration?width=${state.width}&height=${state.height}`);
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CONFIGURATION_DATA', payload: data.configuration });
        
        // Set default values
        const defaultOptions: Record<number, number> = {};
        
        data.configuration.steps.forEach((step: ConfigurationStep) => {
          step.options.forEach((option: ConfigurationOption) => {
            const defaultValue = option.values.find(v => v.is_default);
            if (defaultValue) {
              defaultOptions[option.option_id] = defaultValue.value_id;
            }
          });
        });
        
        // Set default options
        Object.entries(defaultOptions).forEach(([optionId, valueId]) => {
          dispatch({ type: 'SET_OPTION', payload: { optionId: Number(optionId), valueId } });
        });
      }
    } catch (error) {
      console.error('Error loading configuration data:', error);
    }
  };

  const setOption = (optionId: number, valueId: number) => {
    dispatch({ type: 'SET_OPTION', payload: { optionId, valueId } });
    
    // Clear any validation errors for this option
    dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: `option_${optionId}` });
  };

  const setDimensions = (width: number, height: number) => {
    // Validate dimensions
    const minWidth = 12;
    const maxWidth = 96;
    const minHeight = 12;
    const maxHeight = 108;
    
    if (width < minWidth || width > maxWidth) {
      dispatch({ 
        type: 'SET_VALIDATION_ERROR', 
        payload: { field: 'width', error: `Width must be between ${minWidth}" and ${maxWidth}"` }
      });
      return;
    }
    
    if (height < minHeight || height > maxHeight) {
      dispatch({ 
        type: 'SET_VALIDATION_ERROR', 
        payload: { field: 'height', error: `Height must be between ${minHeight}" and ${maxHeight}"` }
      });
      return;
    }
    
    dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: 'width' });
    dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: 'height' });
    dispatch({ type: 'SET_DIMENSIONS', payload: { width, height } });
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      const maxStep = (state.configurationData?.steps.length || 1) - 1;
      if (state.currentStep < maxStep) {
        dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
      }
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToStep = (step: number) => {
    const maxStep = (state.configurationData?.steps.length || 1) - 1;
    if (step >= 0 && step <= maxStep) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  };

  const calculatePrice = async () => {
    if (!state.configurationData) return;
    
    try {
      dispatch({ type: 'SET_CALCULATING', payload: true });
      
      const response = await fetch(`/api/products/${productSlug}/configuration/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: state.selectedOptions,
          width: state.width,
          height: state.height
        }),
      });

      if (response.ok) {
        const pricing = await response.json();
        dispatch({
          type: 'SET_PRICING',
          payload: {
            basePrice: pricing.basePrice,
            optionModifiers: pricing.optionModifiers,
            ruleModifiers: pricing.ruleModifiers,
            totalPrice: pricing.totalPrice
          }
        });
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      dispatch({ type: 'SET_CALCULATING', payload: false });
    }
  };

  const validateCurrentStep = (): boolean => {
    const currentStep = getCurrentStep();
    if (!currentStep) return true;

    let isValid = true;

    // Validate required options in current step
    currentStep.options.forEach(option => {
      if (option.is_required && !state.selectedOptions[option.option_id]) {
        dispatch({
          type: 'SET_VALIDATION_ERROR',
          payload: { field: `option_${option.option_id}`, error: `${option.option_name} is required` }
        });
        isValid = false;
      }
    });

    // Apply validation rules if any
    if (currentStep.validation_rules) {
      try {
        const rules = currentStep.validation_rules;
        // Apply custom validation rules here
        // This could be extended based on your specific validation needs
      } catch (error) {
        console.warn('Error applying validation rules:', error);
      }
    }

    return isValid;
  };

  const resetConfiguration = () => {
    dispatch({ type: 'RESET_CONFIGURATION' });
  };

  const getCurrentStep = (): ConfigurationStep | undefined => {
    return state.configurationData?.steps[state.currentStep];
  };

  const getSelectedOptionValue = (optionId: number): OptionValue | undefined => {
    const valueId = state.selectedOptions[optionId];
    if (!valueId || !state.configurationData) return undefined;

    for (const step of state.configurationData.steps) {
      for (const option of step.options) {
        if (option.option_id === optionId) {
          return option.values.find(v => v.value_id === valueId);
        }
      }
    }
    return undefined;
  };

  const getOptionByName = (name: string): ConfigurationOption | undefined => {
    if (!state.configurationData) return undefined;

    for (const step of state.configurationData.steps) {
      for (const option of step.options) {
        if (option.option_name.toLowerCase() === name.toLowerCase()) {
          return option;
        }
      }
    }
    return undefined;
  };

  const getApplicableRules = (): ConfigurationRule[] => {
    if (!state.configurationData) return [];

    return state.configurationData.rules.filter(rule => {
      try {
        const conditions = rule.condition_data;
        // Simple rule evaluation - this could be made more sophisticated
        for (const condition of conditions) {
          if (condition.type === 'option_selected') {
            const selectedValue = state.selectedOptions[condition.option_id];
            if (!condition.values.includes(selectedValue)) {
              return false;
            }
          }
        }
        return true;
      } catch (error) {
        console.warn('Error evaluating rule:', rule.rule_name, error);
        return false;
      }
    });
  };

  const contextValue: ConfigurationContextType = {
    state,
    dispatch,
    setOption,
    setDimensions,
    nextStep,
    prevStep,
    goToStep,
    calculatePrice,
    validateCurrentStep,
    resetConfiguration,
    getCurrentStep,
    getSelectedOptionValue,
    getOptionByName,
    getApplicableRules
  };

  return (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );
}

export function useDynamicConfiguration() {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useDynamicConfiguration must be used within a DynamicConfigurationProvider');
  }
  return context;
}

export type { ConfigurationStep, ConfigurationOption, OptionValue, ConfigState };