'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useDynamicConfiguration, ConfigurationStep, ConfigurationOption, OptionValue } from './DynamicConfigurationContext';
import { Ruler, Palette, Settings, Package, Info } from 'lucide-react';

interface DynamicStepContentProps {
  step: ConfigurationStep;
}

export function DynamicStepContent({ step }: DynamicStepContentProps) {
  const { state, setOption, setDimensions, getSelectedOptionValue } = useDynamicConfiguration();

  const renderOptionInput = (option: ConfigurationOption) => {
    const selectedValue = getSelectedOptionValue(option.option_id);
    const hasError = state.validationErrors[`option_${option.option_id}`];

    switch (option.option_type) {
      case 'dropdown':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {option.option_name}
              {option.is_required && <span className="text-red-500">*</span>}
            </Label>
            {option.help_text && (
              <p className="text-sm text-gray-600">{option.help_text}</p>
            )}
            <Select
              value={selectedValue?.value_id.toString() || ''}
              onValueChange={(value) => setOption(option.option_id, parseInt(value))}
            >
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${option.option_name}`} />
              </SelectTrigger>
              <SelectContent>
                {option.values
                  .filter(v => v.is_available)
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((value) => (
                    <SelectItem key={value.value_id} value={value.value_id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{value.value_name}</span>
                        {value.price_modifier !== 0 && (
                          <Badge variant={value.price_modifier > 0 ? 'default' : 'secondary'}>
                            {value.price_modifier > 0 ? '+' : ''}${Math.abs(value.price_modifier)}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              {option.option_name}
              {option.is_required && <span className="text-red-500">*</span>}
            </Label>
            {option.help_text && (
              <p className="text-sm text-gray-600">{option.help_text}</p>
            )}
            <RadioGroup
              value={selectedValue?.value_id.toString() || ''}
              onValueChange={(value) => setOption(option.option_id, parseInt(value))}
              className={`grid gap-3 ${hasError ? 'border border-red-500 rounded p-3' : ''}`}
            >
              {option.values
                .filter(v => v.is_available)
                .sort((a, b) => a.display_order - b.display_order)
                .map((value) => (
                  <div key={value.value_id} className="flex items-center space-x-2">
                    <RadioGroupItem value={value.value_id.toString()} id={`option-${option.option_id}-${value.value_id}`} />
                    <Label htmlFor={`option-${option.option_id}-${value.value_id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{value.value_name}</div>
                          {value.description && (
                            <div className="text-sm text-gray-600">{value.description}</div>
                          )}
                        </div>
                        {value.price_modifier !== 0 && (
                          <Badge variant={value.price_modifier > 0 ? 'default' : 'secondary'}>
                            {value.price_modifier > 0 ? '+' : ''}${Math.abs(value.price_modifier)}
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                ))
              }
            </RadioGroup>
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              {option.option_name}
              {option.is_required && <span className="text-red-500">*</span>}
            </Label>
            {option.help_text && (
              <p className="text-sm text-gray-600">{option.help_text}</p>
            )}
            <div className={`space-y-2 ${hasError ? 'border border-red-500 rounded p-3' : ''}`}>
              {option.values
                .filter(v => v.is_available)
                .sort((a, b) => a.display_order - b.display_order)
                .map((value) => (
                  <div key={value.value_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${option.option_id}-${value.value_id}`}
                      checked={selectedValue?.value_id === value.value_id}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setOption(option.option_id, value.value_id);
                        }
                      }}
                    />
                    <Label htmlFor={`option-${option.option_id}-${value.value_id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{value.value_name}</div>
                          {value.description && (
                            <div className="text-sm text-gray-600">{value.description}</div>
                          )}
                        </div>
                        {value.price_modifier !== 0 && (
                          <Badge variant={value.price_modifier > 0 ? 'default' : 'secondary'}>
                            {value.price_modifier > 0 ? '+' : ''}${Math.abs(value.price_modifier)}
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                ))
              }
            </div>
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        );

      case 'color':
        return (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              {option.option_name}
              {option.is_required && <span className="text-red-500">*</span>}
            </Label>
            {option.help_text && (
              <p className="text-sm text-gray-600">{option.help_text}</p>
            )}
            <div className={`grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 ${hasError ? 'border border-red-500 rounded p-3' : ''}`}>
              {option.values
                .filter(v => v.is_available)
                .sort((a, b) => a.display_order - b.display_order)
                .map((value) => (
                  <button
                    key={value.value_id}
                    onClick={() => setOption(option.option_id, value.value_id)}
                    className={`
                      relative w-16 h-16 rounded-lg border-2 transition-all hover:scale-105
                      ${selectedValue?.value_id === value.value_id 
                        ? 'border-red-500 ring-2 ring-red-200'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    style={{ backgroundColor: value.value_data || '#000000' }}
                    title={value.value_name}
                  >
                    {value.image_url && (
                      <img
                        src={value.image_url}
                        alt={value.value_name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                    {selectedValue?.value_id === value.value_id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {value.price_modifier !== 0 && (
                      <div className="absolute -bottom-1 -right-1">
                        <Badge variant={value.price_modifier > 0 ? 'default' : 'secondary'} className="text-xs">
                          {value.price_modifier > 0 ? '+' : ''}${Math.abs(value.price_modifier)}
                        </Badge>
                      </div>
                    )}
                  </button>
                ))
              }
            </div>
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        );

      case 'dimension':
        return (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              {option.option_name}
              {option.is_required && <span className="text-red-500">*</span>}
            </Label>
            {option.help_text && (
              <p className="text-sm text-gray-600">{option.help_text}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  min="12"
                  max="96"
                  step="0.125"
                  value={state.width}
                  onChange={(e) => setDimensions(parseFloat(e.target.value), state.height)}
                  className={state.validationErrors.width ? 'border-red-500' : ''}
                />
                {state.validationErrors.width && (
                  <p className="text-sm text-red-500 mt-1">{state.validationErrors.width}</p>
                )}
              </div>
              <div>
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  min="12"
                  max="108"
                  step="0.125"
                  value={state.height}
                  onChange={(e) => setDimensions(state.width, parseFloat(e.target.value))}
                  className={state.validationErrors.height ? 'border-red-500' : ''}
                />
                {state.validationErrors.height && (
                  <p className="text-sm text-red-500 mt-1">{state.validationErrors.height}</p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total Area: {((state.width * state.height) / 144).toFixed(2)} sq ft
            </div>
          </div>
        );

      case 'text':
      case 'number':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {option.option_name}
              {option.is_required && <span className="text-red-500">*</span>}
            </Label>
            {option.help_text && (
              <p className="text-sm text-gray-600">{option.help_text}</p>
            )}
            <Input
              type={option.option_type}
              value={selectedValue?.value_data || ''}
              onChange={(e) => {
                // For text/number inputs, we need to handle this differently
                // This is a simplified implementation
                const firstValue = option.values[0];
                if (firstValue) {
                  setOption(option.option_id, firstValue.value_id);
                }
              }}
              className={hasError ? 'border-red-500' : ''}
              placeholder={`Enter ${option.option_name}`}
            />
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        );

      default:
        return <div>Unsupported option type: {option.option_type}</div>;
    }
  };

  const getStepIcon = (stepName: string) => {
    const name = stepName.toLowerCase();
    if (name.includes('dimension') || name.includes('size')) return <Ruler className="w-5 h-5" />;
    if (name.includes('color') || name.includes('material')) return <Palette className="w-5 h-5" />;
    if (name.includes('option') || name.includes('control')) return <Settings className="w-5 h-5" />;
    if (name.includes('review') || name.includes('summary')) return <Package className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto">
          {getStepIcon(step.step_name)}
        </div>
        <h2 className="text-2xl font-bold">{step.step_title}</h2>
        {step.step_description && (
          <p className="text-gray-600 max-w-2xl mx-auto">{step.step_description}</p>
        )}
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6">
          {step.options
            .sort((a, b) => (a.step_display_order || a.display_order) - (b.step_display_order || b.display_order))
            .map((option) => (
              <Card key={option.option_id} className={option.is_primary ? 'border-red-200 bg-red-50/50' : ''}>
                <CardContent className="p-6">
                  {renderOptionInput(option)}
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Help Content */}
        {step.help_content && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: step.help_content }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}