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
import { Badge } from "@/components/ui/badge";
import { Building2, User } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createFormSchema = (isAdmin: boolean) => z.object({
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
    .regex(/^[A-Za-z0-9-_]*$/, "SKU can only contain letters, numbers, hyphens, and underscores"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(255, "Slug cannot exceed 255 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  vendorId: isAdmin 
    ? z.string().min(1, "Vendor assignment is required") 
    : z.string().optional(),
  basePrice: z.number().min(0.01, "Base price is required and must be greater than 0"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

interface Vendor {
  user_id: number;
  business_name: string;
  business_email: string;
  approval_status: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface BasicInfoProps {
  data: any; // Temporarily use any to handle migration
  categories: string[];
  onChange: (data: any) => void;
  showVendorSelection?: boolean; // New prop to control vendor dropdown visibility
  isReadOnly?: boolean; // New prop for read-only mode
  isAdmin?: boolean; // New prop to determine if admin (makes vendor selection required)
}

export default function BasicInfo({ data, categories: propCategories, onChange, showVendorSelection = true, isReadOnly = false, isAdmin = false }: BasicInfoProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Convert old data format to new format if needed
  const formData = React.useMemo(() => {
    // Ensure data exists and has proper structure
    const safeData = data || {};
    
    if (safeData.category && !safeData.categories) {
      return {
        ...safeData,
        categories: [safeData.category],
        primaryCategory: safeData.category
      };
    }
    
    // Return data with defaults for required fields
    return {
      name: '',
      slug: '',
      shortDescription: '',
      fullDescription: '',
      sku: '',
      basePrice: 0,
      vendorId: '',
      isActive: true,
      isFeatured: false,
      categories: [],
      primaryCategory: '',
      ...safeData
    };
  }, [data]);

  const formSchema = createFormSchema(isAdmin);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  });

  // Update form when data changes
  useEffect(() => {
    // Check if we have actual data (not just defaults) by checking if name exists and is not empty
    if (data && data.name && data.name.trim() !== '') {
      // Force form reset with proper values after a delay to avoid render loops
      const timer = setTimeout(() => {
        form.reset(formData);

        // Set primary category after form reset if we have categories and a primary category
        if (data.categories?.length > 0 && data.primaryCategory) {
          // Give extra time for categories to populate in the form
          setTimeout(() => {
            form.setValue('primaryCategory', data.primaryCategory);
          }, 100);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [data?.name, data?.categories?.length, data?.primaryCategory]); // Include primaryCategory in deps

  // Fetch data only once on mount
  useEffect(() => {
    fetchCategories();
    if (showVendorSelection) {
      fetchVendors();
    }
  }, []); // Empty dependency array - only run once

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/v2/commerce/categories');
      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        setCategories(data.data?.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await fetch('/api/v2/admin/vendors');
      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        setVendors(data.data?.vendors || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoadingVendors(false);
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
              <FormLabel>Product Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter product name" 
                  {...field} 
                  disabled={isReadOnly}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    // Auto-generate slug from product name if slug is empty
                    const currentSlug = form.getValues('slug');
                    if (!currentSlug || currentSlug.trim() === '') {
                      const autoSlug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                      form.setValue('slug', autoSlug);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                The name of your product as it will appear to customers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showVendorSelection && (
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign to Vendor {isAdmin ? '*' : '(Hidden)'}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor or leave blank for marketplace product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="marketplace">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Marketplace Product (No specific vendor)</span>
                      </div>
                    </SelectItem>
                    {loadingVendors ? (
                      <SelectItem value="loading" disabled>
                        Loading vendors...
                      </SelectItem>
                    ) : (
                      vendors.map((vendor) => (
                        <SelectItem key={vendor.user_id} value={vendor.user_id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{vendor.business_name}</span>
                            </div>
                            <Badge 
                              variant={vendor.is_active && vendor.approval_status === 'approved' ? 'default' : 'secondary'} 
                              className="ml-2"
                            >
                              {vendor.is_active && vendor.approval_status === 'approved' ? 'active' : vendor.approval_status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Assign this product to a specific vendor or leave blank to make it available for all vendors to clone
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories *</FormLabel>
              <FormControl>
                <MultiSelect
                  options={
                    loadingCategories
                      ? [{ label: "Loading categories...", value: "loading" }]
                      : categories.map((cat) => ({
                          label: cat.name,
                          value: cat.name, // Using name for now to maintain compatibility
                        }))
                  }
                  selected={field.value || []}
                  onChange={(selected) => {
                    field.onChange(selected);
                    const currentPrimary = form.getValues("primaryCategory");
                    
                    // If we have a primary category from the database and it's in the selected categories, keep it
                    if (currentPrimary && selected.includes(currentPrimary)) {
                      // Don't change anything, keep the database value
                      return;
                    }
                    
                    // Only auto-select primary if no primary is set and we have categories
                    if (selected.length > 0 && (!currentPrimary || !selected.includes(currentPrimary))) {
                      form.setValue("primaryCategory", selected[0]);
                    }
                    // Clear primary if no categories selected
                    if (selected.length === 0) {
                      form.setValue("primaryCategory", "");
                    }
                  }}
                  placeholder="Select categories..."
                  className="w-full"
                  disabled={isReadOnly}
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
          render={({ field }) => {
            // Get current categories from form state
            const currentCategories = form.watch("categories") || [];

            return (
              <FormItem>
                <FormLabel>Primary Category *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={isReadOnly || currentCategories.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currentCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the main category for this product (must be one of the selected categories)
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU *</FormLabel>
              <FormControl>
                <Input placeholder="Enter product SKU" {...field} disabled={isReadOnly} />
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
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="product-url-slug" 
                  {...field} 
                  disabled={isReadOnly}
                  onChange={(e) => {
                    // Auto-format slug as user types
                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                    field.onChange(slug);
                  }}
                />
              </FormControl>
              <FormDescription>
                URL-friendly version of the product name (will be used in product URLs)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price ($) *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="0.00"
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormDescription>
                Base price for the product (vendors can set their own pricing)
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
              <FormLabel>Short Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a brief description"
                  rows={3}
                  {...field}
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
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