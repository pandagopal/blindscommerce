{
  "metadata": {
    "title": "Claude's BlindsCommerce Application Reference",
    "format": "machine_readable_json",
    "last_updated": "2025-06-23",
    "version": "2.0",
    "purpose": "comprehensive_technical_documentation_for_claude_ai_assistant"
  },
  
  "project_overview": {
    "name": "BlindsCommerce",
    "description": "comprehensive e-commerce platform for custom window treatments",
    "framework": "Next.js 14",
    "architecture": "multi-role system",
    "supported_roles": ["customers", "vendors", "sales_representatives", "installers", "administrators"],
    "business_model": {
      "type": "multi_vendor_marketplace",
      "comparison": "Amazon for blinds",
      "market_segments": ["B2B", "B2C"],
      "key_features": [
        "custom_product_configuration",
        "real_time_pricing",
        "installation_services",
        "smart_home_integration",
        "ai_ar_product_visualization"
      ]
    }
  },
  
  "tech_stack": {
    "core_framework": {
      "nextjs": "15.2.0",
      "react": "18.3.1", 
      "typescript": "5.8.3",
      "css": "Tailwind CSS 3.4.17",
      "database": "MySQL"
    },
    "key_libraries": {
      "authentication": ["JWT", "jose", "bcrypt"],
      "ui_components": ["Radix UI", "Shadcn/UI"],
      "database": ["MySQL2", "Prisma"],
      "forms": ["React Hook Form", "Zod"],
      "payments": ["Stripe", "PayPal", "Braintree"],
      "real_time": ["Socket.IO"],
      "3d_ar": ["Three.js", "React Three Fiber", "TensorFlow.js"],
      "email": ["Nodemailer"],
      "file_processing": ["Sharp"]
    },
    "build_tools": {
      "linting": "Biome",
      "config": "ESLint",
      "css_processing": "PostCSS",
      "deployment": "Netlify"
    }
  },
  
  "project_structure": {
    "app_directory": {
      "description": "Next.js App Router pages",
      "subdirectories": {
        "account": "customer dashboard pages",
        "admin": "admin portal comprehensive management",
        "api": "API routes REST endpoints",
        "components": "page specific components",
        "products": "product catalog and configuration",
        "sales": "sales representative portal",
        "installer": "installer job management",
        "vendor": "vendor management pages",
        "storefront": "individual vendor storefronts"
      }
    },
    "components_directory": {
      "description": "reusable UI components",
      "subdirectories": {
        "ui": "Shadcn/UI component library",
        "products": "product related components",
        "payments": "payment processing components",
        "admin": "admin specific components"
      }
    },
    "lib_directory": {
      "description": "utility libraries and services",
      "subdirectories": {
        "auth": "authentication system",
        "db": "database connection and utilities",
        "security": "validation rate limiting file upload",
        "smart_home": "IoT device integration",
        "utils": "general utilities"
      }
    },
    "other_directories": {
      "context": "React Context providers",
      "prisma": "database schema",
      "public": "static assets",
      "scripts": "database and maintenance scripts"
    }
  },
  
  "authentication_system": {
    "jwt_configuration": {
      "expiration": "24_hours",
      "storage": "http_only_cookies",
      "security": "role_based_access_control"
    },
    "password_requirements": {
      "minimum_length": 8,
      "required_elements": ["uppercase", "lowercase", "number", "special_character"]
    },
    "registration_rules": {
      "public_registration": {
        "allowed_roles": ["customer"],
        "endpoint": "/register"
      },
      "business_accounts": {
        "created_by": "admin",
        "endpoint": "/admin/users/new"
      },
      "sales_teams": {
        "created_by": "vendor",
        "endpoint": "/vendor/sales-team"
      }
    },
    "role_hierarchy": {
      "super_admin": {
        "level": 100,
        "description": "platform ownership complete system access",
        "can_create": ["admin", "vendor", "installer", "customer", "trade_professional"],
        "can_manage": "all_user_types_and_roles",
        "permissions": ["full_system_control", "financial_access", "analytics"]
      },
      "admin": {
        "level": 90,
        "description": "platform administration broad access",
        "can_create": ["vendor", "installer", "trade_professional"],
        "can_manage": ["vendors", "installers", "customers", "trade_professionals"],
        "permissions": ["user_management", "vendor_approval", "order_management", "analytics"]
      },
      "vendor": {
        "level": 70,
        "description": "business partner selling products on platform",
        "can_create": ["sales_representative"],
        "can_manage": ["own_sales_team"],
        "permissions": ["product_management", "order_fulfillment", "storefront_control", "sales_team_management"]
      },
      "installer": {
        "level": 60,
        "description": "professional installation services",
        "can_create": "none",
        "can_manage": "none",
        "permissions": ["installation_jobs", "measurements", "customer_contact_for_assigned_work"]
      },
      "sales_representative": {
        "level": 50,
        "description": "vendor sales team member",
        "can_create": "none",
        "can_manage": "none",
        "permissions": ["lead_management", "quotes", "commission_tracking", "assigned_customer_contact"]
      },
      "trade_professional": {
        "level": 40,
        "description": "B2B customers designers architects contractors",
        "can_create": "none",
        "can_manage": "none",
        "permissions": ["trade_pricing_access", "project_management", "client_management"]
      },
      "customer": {
        "level": 10,
        "description": "regular consumers purchasing window treatments",
        "can_create": "none",
        "can_manage": "own_account",
        "permissions": ["shopping", "orders", "account_management", "reviews"]
      }
    }
  },
  
  "core_business_features": {
    "product_configuration": {
      "features": [
        "multi_step_configurator_real_time_pricing",
        "custom_dimensions_fraction_precision",
        "material_color_selection_swatches",
        "room_visualization_ar_capabilities",
        "mount_types_controls_accessories",
        "volume_pricing_discounts"
      ]
    },
    "shopping_cart": {
      "features": [
        "persistent_cart_auto_save",
        "guest_authenticated_user_support",
        "save_for_later_functionality",
        "bulk_operations_cart_templates",
        "price_alerts_notifications",
        "multiple_shipping_addresses",
        "gift_wrapping_messaging",
        "installation_service_booking",
        "sample_ordering_limits"
      ]
    },
    "pricing_engine": {
      "discount_types": [
        "volume_discounts_quantity_tiers",
        "customer_specific_pricing",
        "coupon_codes_usage_tracking",
        "promotional_campaigns",
        "seasonal_time_based_rules"
      ],
      "calculations": {
        "tax": "8.25_percent_default",
        "shipping": "free_over_100_dollars",
        "minimum_order": "requirement_enforcement"
      }
    },
    "order_management": {
      "features": [
        "complex_order_creation_transaction_support",
        "multi_vendor_order_splitting",
        "order_modifications_after_placement",
        "guest_order_support",
        "reorder_functionality",
        "installation_scheduling"
      ]
    }
  },
  
  "api_architecture": {
    "endpoint_structure": {
      "auth": "/api/auth/* - authentication login register logout",
      "products": "/api/products/* - product CRUD search configuration",
      "orders": "/api/orders/* - order management modifications",
      "cart": "/api/cart/* - cart operations pricing recommendations",
      "pricing": "/api/pricing/* - dynamic pricing calculations",
      "account": "/api/account/* - user account management",
      "admin": "/api/admin/* - administrative functions",
      "vendor": "/api/vendor/* - vendor portal APIs",
      "sales": "/api/sales/* - sales representative tools",
      "installer": "/api/installer/* - installation management",
      "payments": "/api/payments/* - payment processing multiple providers",
      "ai_designer": "/api/ai-designer/* - AI powered design features",
      "room_visualizer": "/api/room-visualizer/* - AR ML room analysis",
      "analytics": "/api/analytics/* - business intelligence",
      "iot": "/api/iot/* - smart home integration"
    },
    "middleware": {
      "authentication": "JWT verification protected routes",
      "authorization": "role based access enforcement",
      "security": "rate limiting protection",
      "headers": "security headers application"
    }
  },
  
  "ui_system": {
    "design_system": {
      "colors_file": "/app/styles/colors.ts",
      "framework": "Tailwind CSS custom design tokens",
      "approach": "responsive design mobile first",
      "accessibility": "built in features"
    },
    "color_scheme": {
      "primary_red": "#CC2229",
      "dark_blue": "#1A365D",
      "text_primary": "#333333",
      "text_secondary": "#717171",
      "background_light": "#F5F5F5",
      "background_white": "#FFFFFF"
    },
    "component_architecture": {
      "library": "Shadcn/UI",
      "primitives": "Radix UI",
      "variants": "Class Variance Authority",
      "animations": "Tailwind Animate"
    }
  },
  
  "security_measures": {
    "input_validation": {
      "schemas": "Zod comprehensive validation",
      "rate_limiting": "configurable windows",
      "xss_prevention": "input sanitization",
      "sql_injection": "parameterized queries",
      "csrf_protection": "secure cookies"
    },
    "file_upload_security": {
      "allowed_types": ["JPEG", "PNG", "WebP", "PDF"],
      "scanning": "malicious content detection",
      "size_limits": "5MB images 10MB documents",
      "filename_generation": "secure random naming",
      "directory_protection": "traversal prevention"
    },
    "security_headers": {
      "csp": "Content Security Policy",
      "hsts": "HTTP Strict Transport Security",
      "xss_protection": "XSS protection headers",
      "frame_options": "clickjacking protection"
    }
  },
  
  "database_schema": {
    "user_management": [
      "users - role based access",
      "authentication - password hashing",
      "user_preferences - settings"
    ],
    "product_catalog": [
      "products - features specifications materials",
      "categories - subcategories",
      "vendor_specific - product options",
      "pricing_matrices - volume discounts"
    ],
    "ecommerce_core": [
      "orders - complex pricing calculations",
      "cart_items - configuration data",
      "shipping_addresses - payment methods",
      "order_modifications - tracking"
    ],
    "business_features": [
      "room_visualizations - measurements",
      "sales_pipeline - customers appointments leads",
      "installation_jobs - scheduling",
      "product_comparisons - analytics",
      "swatch_ordering - system"
    ]
  },
  
  "advanced_features": {
    "ai_ml_capabilities": [
      "product_recommendations - behavior based",
      "visual_search - image upload",
      "room_analysis - product placement",
      "emotion_detection - design preferences",
      "predictive_analytics - inventory"
    ],
    "smart_home_integration": [
      "tuya_iot_platform - motorized blinds",
      "multi_platform_bridge - alexa google homekit",
      "voice_control - automation",
      "real_time_device - synchronization"
    ],
    "ar_vr_features": [
      "room_visualization - product placement",
      "mobile_ar - preview capabilities",
      "3d_product_configurator",
      "window_detection - measurement",
      "lighting_simulation - effects"
    ]
  },
  
  "development_commands": {
    "development": "npm run dev - start development server",
    "build": "npm run build - build for production",
    "start": "npm run start - start production server",
    "lint": "npm run lint - run Biome linter TypeScript check",
    "format": "npm run format - format code with Biome",
    "database": "npm run db:setup - initialize database"
  },
  
  "environment_configuration": {
    "required_variables": {
      "database": "DATABASE_URL",
      "jwt": "JWT_SECRET",
      "stripe": "STRIPE_SECRET_KEY",
      "paypal": "PAYPAL_CLIENT_ID",
      "braintree": "BRAINTREE_MERCHANT_ID",
      "email": ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
      "file_upload": "UPLOAD_MAX_SIZE",
      "smart_home": ["TUYA_API_KEY", "TUYA_API_SECRET"]
    }
  },
  
  "critical_fixes_and_issues": {
    "database_connection_leak_prevention_june_2025": {
      "issue": "database connections reached 152 from 10 limit causing site failure",
      "root_causes": [
        "disabled_settings_cache_causing_every_getSetting_call_to_hit_database",
        "multiple_database_calls_per_request_pricing_tax_15_20_calls_per_checkout",
        "missing_tax_rate_caching_every_zip_lookup_1_4_database_calls"
      ],
      "solution": {
        "settings_cache": "re_enabled_5_minute_cache",
        "tax_calculation": "added_10_minute_cache_per_zip_code",
        "pricing_api": "reduced_calls_through_caching"
      },
      "connection_patterns": {
        "correct_non_transactional": "pool.execute() directly",
        "incorrect_causes_leaks": "pool.getConnection() without release",
        "correct_transactional": "getConnection() with try_catch_finally_release"
      },
      "fixed_files": [
        "/lib/auth.ts",
        "/app/api/account/dashboard/route.ts",
        "/app/api/orders/create/route.ts",
        "/lib/services/products.ts",
        "/lib/email/emailService.ts"
      ]
    },
    "mysql_parameter_binding_issues_june_2025": {
      "issue": "APIs failing with Incorrect arguments to mysqld_stmt_execute",
      "root_cause": "MySQL2 parameter binding issues with LIMIT ? OFFSET ? syntax",
      "solution": {
        "problematic_pattern": "LIMIT ? OFFSET ? with parameters",
        "working_solution": "LIMIT ${limit} OFFSET ${offset} with validated integers",
        "safe_interpolation_rules": "only for validated integers predefined columns ORDER BY directions",
        "never_interpolate": "user input strings untrusted data dynamic table names"
      },
      "pagination_pattern": "WHERE with parameters, LIMIT OFFSET with safe interpolation"
    },
    "checkout_tax_calculation_fixes_june_2025": {
      "issues_fixed": [
        "checkout_redirect_on_refresh_race_condition",
        "missing_coupon_codes_during_tax_calculation",
        "taxjar_api_called_during_cart_browsing_should_only_calculate_at_checkout"
      ],
      "solutions": {
        "checkout_redirect": "added cartLoadAttempted state, increased timeout 100ms to 1500ms",
        "tax_flow": "cart stage no tax, checkout stage tax calculated when billing ZIP entered",
        "optimization": "added ZIP code caching 10 minute cache per ZIP"
      }
    },
    "payment_credential_encryption_june_2025": {
      "issue": "payment credentials stored as plain text in database",
      "solution": "implemented AES-256-GCM encryption",
      "implementation": {
        "algorithm": "AES-256-GCM",
        "key_derivation": "PBKDF2 100000 iterations",
        "format": "base64(iv + auth_tag + encrypted_data)",
        "automatic_detection": "isSensitiveSetting() identifies credentials"
      },
      "protected_credentials": [
        "payment_stripe_secret_key",
        "payment_paypal_client_secret",
        "payment_braintree_private_key",
        "integrations_mailchimp_api_key"
      ]
    },
    "admin_dashboard_access_system_june_2025": {
      "purpose": "enable admins to view any user role dashboard with data isolation",
      "implementation": {
        "session_management": "AdminViewId in sessionStorage",
        "api_communication": "x-admin-view-id header",
        "user_assignment": "effectiveUserId = adminViewId || currentUserId"
      },
      "dashboards_supported": ["vendor", "sales", "installer", "customer"],
      "ui_indicators": "blue banner with user name and back link"
    },
    "lazy_loading_optimization_june_2025": {
      "problem": "dashboard pages causing database connection leak 141+ connections",
      "root_cause": "eager loading all dashboard pages, 13+ duplicate auth calls",
      "solution": {
        "centralized_auth": "/context/AuthContext.tsx single auth call",
        "lazy_loading_hook": "/hooks/useLazyLoad.ts conditional data fetching",
        "route_based_loading": "only fetch when targetPath matches current route"
      },
      "performance_improvement": "90% reduction in connections 141 to 17"
    },
    "cart_security_hardcoded_userid_audit_june_2025": {
      "issue": "all users seeing identical cart shared data userId = 1 hardcoded",
      "security_risk": "data breach cross user visibility",
      "solution": {
        "authentication": "replaced hardcoded userId with getCurrentUser()",
        "role_validation": "cart only accessible to customers and guests",
        "api_security": "all cart endpoints require customer authentication"
      },
      "files_fixed": [
        "/app/api/account/cart/route.ts",
        "/app/api/account/wishlist/route.ts",
        "/components/Navbar.tsx"
      ]
    },
    "checkout_single_page_conversion_june_2025": {
      "change": "multi step wizard to single page unified checkout",
      "benefits": [
        "reduced_cart_abandonment",
        "faster_completion",
        "mobile_friendly_better_experience"
      ],
      "implementation": {
        "removed": "progress steps, activeStep state, navigation buttons",
        "added": "unified container, color coded sections, single submit"
      }
    },
    "comprehensive_caching_system_june_2025": {
      "implementation": "multi tier application caching architecture",
      "performance_impact": "70-90% reduction database queries, 50-80% faster page loads",
      "cache_layers": {
        "server_side": "9 cache instances with configurable TTL",
        "client_side": "4 browser cache instances", 
        "frontend": "Next.js revalidate caching"
      },
      "cached_apis": [
        "homepage_data_15_minute_TTL",
        "products_listing_10_minute_TTL",
        "vendor_discounts_2_minute_TTL",
        "rooms_30_minute_TTL"
      ]
    },
    "multi_vendor_discount_coupon_system_fix_2025": {
      "issue": "conflicting platform wide and vendor specific discounts",
      "solution": {
        "business_rules": "vendor only discounts no platform wide",
        "application_order": "vendor discounts first automatic then vendor coupons",
        "vendor_isolation": "each vendor discounts apply only to their products",
        "cart_display": "complete list applied discounts per vendor"
      },
      "implementation": "/app/api/pricing/calculate/route.ts vendor grouping discount processing"
    }
  },
  
  "vendor_centric_architecture": {
    "core_principle": "products discounts coupons sales people belong to vendors",
    "vendor_tables": {
      "vendor_info": "main vendor profiles vendor_info_id key",
      "vendor_products": "links vendors to products vendor specific pricing",
      "vendor_discounts": "vendor specific discount rules percentage fixed tiered",
      "vendor_coupons": "vendor managed coupon codes",
      "vendor_inventory": "stock levels per vendor",
      "sales_staff": "sales representatives belonging to vendors"
    },
    "multi_vendor_cart_checkout": {
      "cart_structure": "items from different vendors single cart",
      "discount_application": "vendor specific discounts apply individually",
      "checkout_splitting": "single order creates multiple vendor sub orders",
      "commission_calculation": "per vendor based on their items"
    }
  },
  
  "pricing_system_architecture": {
    "multi_layered_engine": "complex B2B B2C pricing strategies",
    "core_pricing_tables": {
      "products": "base_price MSRP, cost_price vendor wholesale",
      "product_pricing_matrix": "dimensional pricing width height ranges",
      "product_fabric_pricing": "fabric specific pricing per square foot",
      "vendor_products": "vendor specific selling price"
    },
    "calculation_flow": [
      "base_price_foundation",
      "dimensional_pricing_if_applicable",
      "fabric_material_costs",
      "configuration_option_modifiers",
      "customer_specific_pricing",
      "dynamic_pricing_rules",
      "volume_discounts",
      "vendor_specific_discounts",
      "coupon_campaign_discounts",
      "shipping_calculation",
      "tax_calculation"
    ],
    "discount_hierarchy": {
      "customer_specific": "fixed_price discount_percent discount_amount markup_percent",
      "volume_discounts": "quantity tiers with percentage discounts",
      "vendor_discounts": "percentage fixed_amount tiered bulk_pricing",
      "coupon_codes": "usage_limits expiration_dates customer_restrictions",
      "promotional_campaigns": "seasonal clearance new_customer category_specific"
    }
  },
  
  "database_tables_actual_schema": {
    "vendor_core": {
      "vendor_info": "vendor_info_id user_id business_name commission_rate",
      "vendor_products": "vendor_id product_id vendor_price quantity_available",
      "vendor_discounts": "vendor_id discount_type discount_value applies_to"
    },
    "product_related": {
      "products": "base_price cost_price no_sale_price_column",
      "product_categories": "product to category mapping",
      "product_features": "product feature assignments",
      "product_rooms": "product room recommendations",
      "product_pricing_matrix": "width_min width_max height_min height_max base_price price_per_sqft",
      "product_fabric_options": "fabric configurations",
      "product_fabric_pricing": "fabric specific pricing",
      "product_images": "product image gallery"
    },
    "room_types_management": {
      "table": "room_types",
      "columns": "room_type_id name description image_url typical_humidity light_exposure privacy_requirements",
      "admin_interface": "/app/admin/rooms/page.tsx full CRUD operations"
    }
  },
  
  "testing_and_development_standards": {
    "mandatory_testing_requirements": {
      "functional_verification": "physically navigate pages verify functionality",
      "end_to_end_data_flow": "verify complete path database to UI",
      "integration_point_verification": "test all integration boundaries",
      "user_workflow_testing": "complete user stories not individual components"
    },
    "completion_criteria": {
      "never_report_complete_until": [
        "actual_UI_tested_verified_working",
        "user_workflows_tested_end_to_end",
        "data_persistence_confirmed",
        "edge_cases_error_states_tested"
      ]
    },
    "common_failure_patterns": {
      "database_api_mismatches": "prefix inconsistencies field name conflicts",
      "frontend_state_issues": "form fields defined no data loading logic",
      "conditional_rendering_bugs": "components hidden due to false conditions",
      "authentication_integration": "pages load API calls fail auth middleware"
    }
  },
  
  "production_deployment": {
    "database_credentials": {
      "host": "localhost",
      "port": 3306,
      "name": "blindscommerce_test",
      "user": "root",
      "note": "rotate credentials if exposed in git"
    },
    "monitoring_requirements": [
      "database_connection_count_max_20_alert",
      "cache_performance_hit_miss_ratios",
      "API_response_times_error_rates",
      "user_authentication_failures"
    ],
    "performance_optimization": [
      "connection_pooling_10_max_connections",
      "caching_strategies_multi_tier",
      "image_optimization_next_js",
      "static_generation_product_pages"
    ]
  },
  
  "business_metrics_and_goals": {
    "performance_targets": {
      "sales_increase": "35% through AI recommendations",
      "returns_reduction": "40% through AR visualization", 
      "supply_chain_efficiency": "67% improvement",
      "purchase_likelihood": "76% higher with voice features"
    },
    "user_experience_targets": [
      "mobile_first_responsive_design",
      "accessibility_compliance_WCAG_2_1",
      "fast_loading_image_optimization",
      "real_time_pricing_inventory_updates"
    ]
  }
}