'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save, ArrowLeft } from 'lucide-react';

interface OptionValue {
  value_id?: number;
  value_name: string;
  value_data?: string;
  price_modifier: number;
  display_order: number;
  is_default: boolean;
  is_available: boolean;
  image_url?: string;
  description?: string;
}

interface ProductOption {
  option_id?: number;
  option_name: string;
  option_type: string;
  is_required: boolean;
  display_order: number;
  help_text?: string;
  validation_rules?: any;
  values: OptionValue[];
  step_id?: number;
  step_display_order?: number;
  is_primary?: boolean;
}

interface ConfigurationStep {
  step_id?: number;
  step_name: string;
  step_title: string;
  step_description?: string;
  step_order: number;
  is_required: boolean;
  validation_rules?: any;
  help_content?: string;
}

interface Color {
  id?: number;
  color_name: string;
  color_code?: string;
  color_family?: string;
  price_adjustment: number;
  is_available: boolean;
  swatch_image?: string;
  display_order: number;
}

interface Material {
  id?: number;
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

interface PricingTier {
  id?: number;
  width_min: number;
  width_max: number;
  height_min: number;
  height_max: number;
  base_price: number;
  price_per_sqft: number;
  is_active: boolean;
}

export default function ProductConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [steps, setSteps] = useState<ConfigurationStep[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pricingMatrix, setPricingMatrix] = useState<PricingTier[]>([]);

  useEffect(() => {
    fetchConfiguration();
  }, [productId]);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/configuration`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
        setSteps(data.steps || []);
        setOptions(data.options || []);
        setColors(data.colors || []);
        setMaterials(data.materials || []);
        setPricingMatrix(data.pricingMatrix || []);
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}/configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steps,
          options,
          colors,
          materials,
          pricingMatrix
        }),
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    const newStep: ConfigurationStep = {
      step_name: '',
      step_title: '',
      step_description: '',
      step_order: steps.length + 1,
      is_required: true,
      validation_rules: {},
      help_content: ''
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const addOption = () => {
    const newOption: ProductOption = {
      option_name: '',
      option_type: 'dropdown',
      is_required: false,
      display_order: options.length + 1,
      help_text: '',
      validation_rules: {},
      values: []
    };
    setOptions([...options, newOption]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setOptions(updatedOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const addOptionValue = (optionIndex: number) => {
    const newValue: OptionValue = {
      value_name: '',
      value_data: '',
      price_modifier: 0,
      display_order: options[optionIndex].values.length + 1,
      is_default: false,
      is_available: true,
      image_url: '',
      description: ''
    };
    
    const updatedOptions = [...options];
    updatedOptions[optionIndex].values.push(newValue);
    setOptions(updatedOptions);
  };

  const updateOptionValue = (optionIndex: number, valueIndex: number, field: string, value: any) => {
    const updatedOptions = [...options];
    updatedOptions[optionIndex].values[valueIndex] = {
      ...updatedOptions[optionIndex].values[valueIndex],
      [field]: value
    };
    setOptions(updatedOptions);
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const updatedOptions = [...options];
    updatedOptions[optionIndex].values = updatedOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
    setOptions(updatedOptions);
  };

  const addColor = () => {
    const newColor: Color = {
      color_name: '',
      color_code: '#000000',
      color_family: '',
      price_adjustment: 0,
      is_available: true,
      swatch_image: '',
      display_order: colors.length + 1
    };
    setColors([...colors, newColor]);
  };

  const updateColor = (index: number, field: string, value: any) => {
    const updatedColors = [...colors];
    updatedColors[index] = { ...updatedColors[index], [field]: value };
    setColors(updatedColors);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      material_name: '',
      material_type: '',
      description: '',
      price_adjustment: 0,
      durability_rating: 5,
      maintenance_level: 'medium',
      is_eco_friendly: false,
      is_available: true,
      sample_available: true,
      texture_image: ''
    };
    setMaterials([...materials, newMaterial]);
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    setMaterials(updatedMaterials);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const addPricingTier = () => {
    const newTier: PricingTier = {
      width_min: 12,
      width_max: 96,
      height_min: 12,
      height_max: 108,
      base_price: 0,
      price_per_sqft: 0,
      is_active: true
    };
    setPricingMatrix([...pricingMatrix, newTier]);
  };

  const updatePricingTier = (index: number, field: string, value: any) => {
    const updatedPricing = [...pricingMatrix];
    updatedPricing[index] = { ...updatedPricing[index], [field]: value };
    setPricingMatrix(updatedPricing);
  };

  const removePricingTier = (index: number) => {
    setPricingMatrix(pricingMatrix.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Product Configuration</h1>
            <p className="text-gray-600">{product?.name}</p>
          </div>
        </div>
        <Button onClick={saveConfiguration} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <Tabs defaultValue="steps" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="steps">Configuration Steps</TabsTrigger>
          <TabsTrigger value="options">Options & Values</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configuration Steps
                <Button onClick={addStep}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Step Name</Label>
                        <Input
                          value={step.step_name}
                          onChange={(e) => updateStep(index, 'step_name', e.target.value)}
                          placeholder="e.g., dimensions"
                        />
                      </div>
                      <div>
                        <Label>Step Title</Label>
                        <Input
                          value={step.step_title}
                          onChange={(e) => updateStep(index, 'step_title', e.target.value)}
                          placeholder="e.g., Choose Dimensions"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={step.step_description || ''}
                          onChange={(e) => updateStep(index, 'step_description', e.target.value)}
                          placeholder="Step description..."
                        />
                      </div>
                      <div>
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={step.step_order}
                          onChange={(e) => updateStep(index, 'step_order', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={step.is_required}
                          onCheckedChange={(checked) => updateStep(index, 'is_required', checked)}
                        />
                        <Label>Required Step</Label>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Product Options
                <Button onClick={addOption}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {options.map((option, optionIndex) => (
                <Card key={optionIndex}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Option Name</Label>
                        <Input
                          value={option.option_name}
                          onChange={(e) => updateOption(optionIndex, 'option_name', e.target.value)}
                          placeholder="e.g., Mount Type"
                        />
                      </div>
                      <div>
                        <Label>Option Type</Label>
                        <Select
                          value={option.option_type}
                          onValueChange={(value) => updateOption(optionIndex, 'option_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                            <SelectItem value="radio">Radio Buttons</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="color">Color Picker</SelectItem>
                            <SelectItem value="dimension">Dimension Input</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={option.is_required}
                          onCheckedChange={(checked) => updateOption(optionIndex, 'is_required', checked)}
                        />
                        <Label>Required</Label>
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={option.display_order}
                          onChange={(e) => updateOption(optionIndex, 'display_order', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Option Values</Label>
                        <Button
                          size="sm"
                          onClick={() => addOptionValue(optionIndex)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Value
                        </Button>
                      </div>
                      
                      {option.values.map((value, valueIndex) => (
                        <Card key={valueIndex} className="mb-2">
                          <CardContent className="p-3">
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <Label className="text-xs">Value Name</Label>
                                <Input
                                  size="sm"
                                  value={value.value_name}
                                  onChange={(e) => updateOptionValue(optionIndex, valueIndex, 'value_name', e.target.value)}
                                  placeholder="e.g., Inside Mount"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Price Modifier</Label>
                                <Input
                                  size="sm"
                                  type="number"
                                  step="0.01"
                                  value={value.price_modifier}
                                  onChange={(e) => updateOptionValue(optionIndex, valueIndex, 'price_modifier', parseFloat(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Order</Label>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={value.display_order}
                                  onChange={(e) => updateOptionValue(optionIndex, valueIndex, 'display_order', parseInt(e.target.value))}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  <Switch
                                    checked={value.is_default}
                                    onCheckedChange={(checked) => updateOptionValue(optionIndex, valueIndex, 'is_default', checked)}
                                  />
                                  <Label className="text-xs">Default</Label>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeOptionValue(optionIndex, valueIndex)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeOption(optionIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Available Colors
                <Button onClick={addColor}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Color
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {colors.map((color, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Color Name</Label>
                        <Input
                          value={color.color_name}
                          onChange={(e) => updateColor(index, 'color_name', e.target.value)}
                          placeholder="e.g., Arctic White"
                        />
                      </div>
                      <div>
                        <Label>Color Code</Label>
                        <Input
                          type="color"
                          value={color.color_code || '#000000'}
                          onChange={(e) => updateColor(index, 'color_code', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Color Family</Label>
                        <Input
                          value={color.color_family || ''}
                          onChange={(e) => updateColor(index, 'color_family', e.target.value)}
                          placeholder="e.g., Whites"
                        />
                      </div>
                      <div>
                        <Label>Price Adjustment</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={color.price_adjustment}
                          onChange={(e) => updateColor(index, 'price_adjustment', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={color.is_available}
                          onCheckedChange={(checked) => updateColor(index, 'is_available', checked)}
                        />
                        <Label>Available</Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeColor(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Available Materials
                <Button onClick={addMaterial}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {materials.map((material, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Material Name</Label>
                        <Input
                          value={material.material_name}
                          onChange={(e) => updateMaterial(index, 'material_name', e.target.value)}
                          placeholder="e.g., Premium Aluminum"
                        />
                      </div>
                      <div>
                        <Label>Material Type</Label>
                        <Input
                          value={material.material_type || ''}
                          onChange={(e) => updateMaterial(index, 'material_type', e.target.value)}
                          placeholder="e.g., Metal"
                        />
                      </div>
                      <div>
                        <Label>Price Adjustment</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={material.price_adjustment}
                          onChange={(e) => updateMaterial(index, 'price_adjustment', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Description</Label>
                        <Textarea
                          value={material.description || ''}
                          onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                          placeholder="Material description..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={material.is_available}
                            onCheckedChange={(checked) => updateMaterial(index, 'is_available', checked)}
                          />
                          <Label>Available</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={material.is_eco_friendly}
                            onCheckedChange={(checked) => updateMaterial(index, 'is_eco_friendly', checked)}
                          />
                          <Label>Eco-Friendly</Label>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Pricing Matrix
                <Button onClick={addPricingTier}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pricing Tier
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingMatrix.map((tier, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-6 gap-4">
                      <div>
                        <Label>Min Width</Label>
                        <Input
                          type="number"
                          step="0.125"
                          value={tier.width_min}
                          onChange={(e) => updatePricingTier(index, 'width_min', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Max Width</Label>
                        <Input
                          type="number"
                          step="0.125"
                          value={tier.width_max}
                          onChange={(e) => updatePricingTier(index, 'width_max', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Min Height</Label>
                        <Input
                          type="number"
                          step="0.125"
                          value={tier.height_min}
                          onChange={(e) => updatePricingTier(index, 'height_min', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Max Height</Label>
                        <Input
                          type="number"
                          step="0.125"
                          value={tier.height_max}
                          onChange={(e) => updatePricingTier(index, 'height_max', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Base Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={tier.base_price}
                          onChange={(e) => updatePricingTier(index, 'base_price', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Price per Sq Ft</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={tier.price_per_sqft}
                          onChange={(e) => updatePricingTier(index, 'price_per_sqft', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={tier.is_active}
                          onCheckedChange={(checked) => updatePricingTier(index, 'is_active', checked)}
                        />
                        <Label>Active</Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removePricingTier(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}