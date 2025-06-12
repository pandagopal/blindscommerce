import { useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormLabel,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  name: z.string()
    .min(1, "Product name is required")
    .max(255, "Product name cannot exceed 255 characters"),
  categories: z.array(z.string())
    .min(1, "At least one category is required"),
  primaryCategory: z.string()
    .min(1, "Primary category is required"),
  shortDescription: z.string()
    .min(1, "Short description is required")
    .max(500, "Short description cannot exceed 500 characters"),
  fullDescription: z.string()
    .max(5000, "Full description cannot exceed 5000 characters")
    .optional()
    .or(z.literal('')),
  sku: z.string()
    .min(1, "SKU is required")
    .max(50, "SKU cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "SKU can only contain letters, numbers, hyphens, and underscores"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface BasicInfoProps {
  data: any;
  categories: string[];
  onChange: (data: any) => void;
}

export default function BasicInfo({ data, categories: propCategories, onChange }: BasicInfoProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Convert old data format to new format if needed
  const formData = React.useMemo(() => {
    if (data.category && !data.categories) {
      return {
        ...data,
        categories: [data.category],
        primaryCategory: data.category
      };
    }
    return data;
  }, [data]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onChange(values);
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        onChange={() => {
          const values = form.getValues();
          onChange(values);
        }}
        className="p-6 space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormDescription>
                The name of your product as it will appear to customers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <MultiSelect
                  options={
                    loadingCategories
                      ? [{ label: "Loading categories...", value: "loading" }]
                      : categories.map((cat) => ({
                          label: cat.name,
                          value: cat.name,
                        }))
                  }
                  selected={field.value || []}
                  onChange={(selected) => {
                    field.onChange(selected);
                    // Auto-select first category as primary if none selected
                    if (selected.length > 0 && !form.getValues("primaryCategory")) {
                      form.setValue("primaryCategory", selected[0]);
                    }
                  }}
                  placeholder="Select categories..."
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                Select all categories that apply to this product
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={!form.watch("categories") || form.watch("categories").length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(form.watch("categories") || []).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the main category for this product
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="Enter product SKU" {...field} />
              </FormControl>
              <FormDescription>
                Unique identifier for your product
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a brief description"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description that appears in product listings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter detailed product description"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed product description with features and benefits
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-8">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-4">
                <FormLabel>Active Status</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Product will be visible to customers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-4">
                <FormLabel>Featured Product</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Display product in featured sections
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}