import { ChangeEvent } from 'react';
import {
  FormControl,
  FormLabel,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BasicInfoProps {
  data: {
    name: string;
    category: string;
    shortDescription: string;
    fullDescription: string;
    sku: string;
    isActive: boolean;
    isFeatured: boolean;
  };
  categories: string[];
  onChange: (data: Partial<BasicInfoProps['data']>) => void;
}

export default function BasicInfo({ data, categories, onChange }: BasicInfoProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    onChange({ [name]: checked });
  };

  const handleCategoryChange = (value: string) => {
    onChange({ category: value });
  };

  return (
    <div className="p-6 space-y-6">
      <FormField>
        <FormItem>
          <FormLabel>Product Name *</FormLabel>
          <FormControl>
            <Input
              name="name"
              value={data.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
            />
          </FormControl>
          <FormDescription>
            The name of your product as it will appear to customers
          </FormDescription>
        </FormItem>
      </FormField>

      <FormField>
        <FormItem>
          <FormLabel>Category *</FormLabel>
          <Select value={data.category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Choose the category that best fits your product
          </FormDescription>
        </FormItem>
      </FormField>

      <FormField>
        <FormItem>
          <FormLabel>SKU</FormLabel>
          <FormControl>
            <Input
              name="sku"
              value={data.sku}
              onChange={handleInputChange}
              placeholder="Enter product SKU"
            />
          </FormControl>
          <FormDescription>
            Unique identifier for your product
          </FormDescription>
        </FormItem>
      </FormField>

      <FormField>
        <FormItem>
          <FormLabel>Short Description *</FormLabel>
          <FormControl>
            <Textarea
              name="shortDescription"
              value={data.shortDescription}
              onChange={handleInputChange}
              placeholder="Enter a brief description"
              rows={3}
            />
          </FormControl>
          <FormDescription>
            A brief description that appears in product listings
          </FormDescription>
        </FormItem>
      </FormField>

      <FormField>
        <FormItem>
          <FormLabel>Full Description</FormLabel>
          <FormControl>
            <Textarea
              name="fullDescription"
              value={data.fullDescription}
              onChange={handleInputChange}
              placeholder="Enter detailed product description"
              rows={6}
            />
          </FormControl>
          <FormDescription>
            Detailed product description with features and benefits
          </FormDescription>
        </FormItem>
      </FormField>

      <div className="flex space-x-8">
        <FormField>
          <FormItem className="flex items-center space-x-4">
            <FormLabel>Active Status</FormLabel>
            <FormControl>
              <Switch
                checked={data.isActive}
                onCheckedChange={handleSwitchChange('isActive')}
              />
            </FormControl>
            <FormDescription>
              Product will be visible to customers
            </FormDescription>
          </FormItem>
        </FormField>

        <FormField>
          <FormItem className="flex items-center space-x-4">
            <FormLabel>Featured Product</FormLabel>
            <FormControl>
              <Switch
                checked={data.isFeatured}
                onCheckedChange={handleSwitchChange('isFeatured')}
              />
            </FormControl>
            <FormDescription>
              Display product in featured sections
            </FormDescription>
          </FormItem>
        </FormField>
      </div>
    </div>
  );
} 