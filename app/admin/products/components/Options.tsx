'use client';

import { useState } from 'react';
import { PlusIcon, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OptionGroup {
  name: string;
  price_adjustment: number;
  is_default?: boolean;
}

interface ProductOptions {
  mountTypes: OptionGroup[];
  controlTypes: OptionGroup[];
  fabricTypes: OptionGroup[];
  headrailOptions: OptionGroup[];
  bottomRailOptions: OptionGroup[];
  specialtyOptions: OptionGroup[];
}

interface OptionsProps {
  data: ProductOptions;
  onChange: (data: ProductOptions) => void;
}

export default function Options({ data, onChange }: OptionsProps) {
  const [newOption, setNewOption] = useState<{ [key: string]: { name: string; price_adjustment: number } }>({
    mountTypes: { name: '', price_adjustment: 0 },
    controlTypes: { name: '', price_adjustment: 0 },
    fabricTypes: { name: '', price_adjustment: 0 },
    headrailOptions: { name: '', price_adjustment: 0 },
    bottomRailOptions: { name: '', price_adjustment: 0 },
    specialtyOptions: { name: '', price_adjustment: 0 },
  });

  const optionCategories = [
    { key: 'mountTypes', label: 'Mount Types' },
    { key: 'controlTypes', label: 'Control Types' },
    { key: 'fabricTypes', label: 'Fabric Types' },
    { key: 'headrailOptions', label: 'Headrail Options' },
    { key: 'bottomRailOptions', label: 'Bottom Rail Options' },
    { key: 'specialtyOptions', label: 'Specialty Options' },
  ];

  const handleAddOption = (category: keyof ProductOptions) => {
    if (!newOption[category].name) return;

    const updatedData = {
      ...data,
      [category]: [
        ...data[category],
        {
          name: newOption[category].name,
          price_adjustment: newOption[category].price_adjustment,
          is_default: data[category].length === 0, // First option is default
        },
      ],
    };

    onChange(updatedData);
    setNewOption({
      ...newOption,
      [category]: { name: '', price_adjustment: 0 },
    });
  };

  const handleRemoveOption = (category: keyof ProductOptions, index: number) => {
    const updatedOptions = [...data[category]];
    updatedOptions.splice(index, 1);

    // If we removed the default option and there are other options, make the first one default
    if (updatedOptions.length > 0 && data[category][index].is_default) {
      updatedOptions[0].is_default = true;
    }

    onChange({
      ...data,
      [category]: updatedOptions,
    });
  };

  const handleSetDefault = (category: keyof ProductOptions, index: number) => {
    const updatedOptions = data[category].map((option, i) => ({
      ...option,
      is_default: i === index,
    }));

    onChange({
      ...data,
      [category]: updatedOptions,
    });
  };

  return (
    <div className="space-y-6">
      {optionCategories.map(({ key, label }) => (
        <Card key={key} className="w-full">
          <CardHeader>
            <CardTitle>{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Option name"
                  value={newOption[key].name}
                  onChange={(e) =>
                    setNewOption({
                      ...newOption,
                      [key]: { ...newOption[key], name: e.target.value },
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Price adjustment"
                  value={newOption[key].price_adjustment}
                  onChange={(e) =>
                    setNewOption({
                      ...newOption,
                      [key]: {
                        ...newOption[key],
                        price_adjustment: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
                <Button onClick={() => handleAddOption(key as keyof ProductOptions)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {data[key as keyof ProductOptions].map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({option.price_adjustment > 0 ? '+' : ''}$
                        {option.price_adjustment.toFixed(2)})
                      </span>
                      {option.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!option.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(key as keyof ProductOptions, index)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(key as keyof ProductOptions, index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 