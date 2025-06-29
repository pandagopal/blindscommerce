{
  "metadata": {
    "title": "Claude's BlindsCommerce Application Reference",
    "format": "machine_readable_json",
    "last_updated": "2025-06-29",
    "version": "3.2",
    "purpose": "comprehensive_technical_documentation_for_claude_ai_assistant",
    "consolidated_from": "26 documentation files merged into single reference",
    "latest_changes": "Added unified_product_page_ui_fixes section with Pricing and Fabric tab UI improvements"
  },
  
  "project_overview": {
    "name": "BlindsCommerce",
    "description": "comprehensive e-commerce platform for custom window treatments",
    "framework": "Next.js 15",
    "architecture": "multi-role system with V2 API consolidation",
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
    },
    "performance_achievements": {
      "api_reduction": "215 APIs → 50 APIs (77% reduction)",
      "database_connections": "152/200 → 12/20 (85% reduction)",
      "response_times": "350ms → 115ms average (67% improvement)",
      "cache_hit_rate": "88% overall",
      "test_coverage": ">90%",
      "page_load": "<3s target achieved",
      "api_response": "<1s target achieved"
    }
  },
  
  "tech_stack": {
    "core_framework": {
      "nextjs": "15.3.1",
      "react": "18.3.1", 
      "typescript": "5.8.3",
      "css": "Tailwind CSS 3.4.17",
      "database": "MySQL 8.0"
    },
    "key_libraries": {
      "authentication": ["JWT", "jose", "bcrypt", "NextAuth"],
      "ui_components": ["Radix UI", "Shadcn/UI"],
      "database": ["MySQL2", "Prisma"],
      "forms": ["React Hook Form", "Zod"],
      "payments": ["Stripe", "PayPal", "Braintree", "Klarna", "Afterpay", "Affirm"],
      "real_time": ["Socket.IO", "Pusher"],
      "3d_ar": ["Three.js", "React Three Fiber", "TensorFlow.js"],
      "email": ["Nodemailer"],
      "file_processing": ["Sharp"],
      "testing": ["Playwright", "K6", "Artillery", "Jest"],
      "monitoring": ["OpenTelemetry"]
    },
    "build_tools": {
      "linting": "Biome",
      "config": "ESLint",
      "css_processing": "PostCSS",
      "deployment": "Netlify",
      "bundler": "Webpack/Turbopack"
    }
  },
  
  "project_structure": {
    "app_directory": {
      "description": "Next.js App Router pages",
      "subdirectories": {
        "account": "customer dashboard pages",
        "admin": "admin portal comprehensive management",
        "api": "API routes REST endpoints - V2 consolidated architecture",
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
        "admin": "admin specific components",
        "cache": "cache management UI components"
      }
    },
    "lib_directory": {
      "description": "utility libraries and services",
      "subdirectories": {
        "auth": "authentication system with JWT and social login",
        "db": "database connection with pooling and optimization",
        "security": "validation rate limiting file upload encryption",
        "smart_home": "IoT device integration Tuya platform",
        "utils": "general utilities",
        "api/v2/handlers": "consolidated API handlers",
        "cache": "multi-tier caching system",
        "services": "business logic services"
      }
    },
    "other_directories": {
      "context": "React Context providers with auth and cart",
      "prisma": "database schema and migrations",
      "public": "static assets and uploads",
      "scripts": "database and maintenance scripts",
      "__tests__": "comprehensive test suite",
      "blindscommerce-ui-tests": "Playwright E2E tests"
    }
  },
  
  "v2_api_architecture": {
    "overview": "Service-based architecture with action routing",
    "pattern": "/api/v2/[service]/[...action]",
    "services": {
      "commerce": "products, cart, orders, pricing",
      "users": "user management, profiles, preferences",
      "vendors": "vendor operations, products, sales team",
      "admin": "administrative functions, analytics",
      "analytics": "business intelligence, reporting",
      "auth": "authentication, authorization",
      "content": "public content, hero banners, rooms, social"
    },
    "benefits": {
      "reduced_endpoints": "77% reduction in API count",
      "standardized_responses": "consistent error handling and format",
      "role_based_access": "automatic permission checking",
      "action_routing": "multiple operations per endpoint",
      "comprehensive_responses": "complete data for workflows"
    },
    "implementation": {
      "base_handler": "ConsolidatedAPIHandler with role checks",
      "error_codes": "25+ specific error codes",
      "response_format": "{ success, data, error, metadata }",
      "caching": "built-in cache integration",
      "monitoring": "automatic performance tracking"
    }
  },
  
  "authentication_system": {
    "jwt_configuration": {
      "expiration": "24_hours",
      "storage": "http_only_cookies",
      "security": "role_based_access_control",
      "refresh_strategy": "sliding window"
    },
    "social_login": {
      "providers": ["Google", "Facebook", "Apple", "Twitter"],
      "implementation": "NextAuth with JWT backend",
      "restrictions": "customer role only for security",
      "email_verification": "required for social accounts",
      "account_linking": "email-based matching"
    },
    "password_requirements": {
      "minimum_length": 8,
      "required_elements": ["uppercase", "lowercase", "number", "special_character"],
      "history": "last 5 passwords blocked",
      "expiry": "90 days for admin/vendor roles"
    },
    "registration_rules": {
      "public_registration": {
        "allowed_roles": ["customer"],
        "endpoint": "/register",
        "verification": "email required"
      },
      "business_accounts": {
        "created_by": "admin",
        "endpoint": "/admin/users/new",
        "approval": "manual verification"
      },
      "sales_teams": {
        "created_by": "vendor",
        "endpoint": "/vendor/sales-team",
        "limit": "based on subscription"
      }
    },
    "role_hierarchy": {
      "super_admin": {
        "level": 100,
        "description": "platform ownership complete system access",
        "can_create": ["admin", "vendor", "installer", "customer", "trade_professional"],
        "can_manage": "all_user_types_and_roles",
        "permissions": ["full_system_control", "financial_access", "analytics", "system_configuration"]
      },
      "admin": {
        "level": 90,
        "description": "platform administration broad access",
        "can_create": ["vendor", "installer", "trade_professional"],
        "can_manage": ["vendors", "installers", "customers", "trade_professionals"],
        "permissions": ["user_management", "vendor_approval", "order_management", "analytics", "content_management"]
      },
      "vendor": {
        "level": 70,
        "description": "business partner selling products on platform",
        "can_create": ["sales_representative"],
        "can_manage": ["own_sales_team", "own_products", "own_orders"],
        "permissions": ["product_management", "order_fulfillment", "storefront_control", "sales_team_management", "commission_tracking"]
      },
      "installer": {
        "level": 60,
        "description": "professional installation services",
        "can_create": "none",
        "can_manage": "assigned_jobs",
        "permissions": ["installation_jobs", "measurements", "customer_contact_for_assigned_work", "job_scheduling"]
      },
      "sales_representative": {
        "level": 50,
        "description": "vendor sales team member",
        "can_create": "none",
        "can_manage": "assigned_customers",
        "permissions": ["lead_management", "quotes", "commission_tracking", "assigned_customer_contact", "limited_product_access"]
      },
      "trade_professional": {
        "level": 40,
        "description": "B2B customers designers architects contractors",
        "can_create": "none",
        "can_manage": "own_projects",
        "permissions": ["trade_pricing_access", "project_management", "client_management", "bulk_ordering"]
      },
      "customer": {
        "level": 10,
        "description": "regular consumers purchasing window treatments",
        "can_create": "none",
        "can_manage": "own_account",
        "permissions": ["shopping", "orders", "account_management", "reviews", "wishlist"]
      }
    }
  },
  
  "caching_system": {
    "architecture": "Multi-tier application and browser caching",
    "server_side_caches": {
      "settings_cache": "5 minute TTL for system settings",
      "tax_cache": "10 minute TTL per ZIP code",
      "product_cache": "10 minute TTL for listings",
      "vendor_cache": "15 minute TTL for vendor data",
      "homepage_cache": "15 minute TTL for static content",
      "room_cache": "30 minute TTL for room types",
      "discount_cache": "2 minute TTL for pricing accuracy",
      "user_cache": "5 minute TTL for profile data",
      "category_cache": "30 minute TTL for navigation"
    },
    "client_side_caches": {
      "cart_cache": "5 minute TTL browser storage",
      "product_cache": "10 minute TTL for viewed items",
      "vendor_cache": "15 minute TTL for storefront",
      "recently_viewed": "session-based tracking"
    },
    "cache_invalidation": {
      "manual": "admin UI for cache clearing",
      "automatic": "on data updates",
      "pattern_based": "wildcard key matching",
      "scheduled": "nightly cache warming"
    },
    "performance_impact": {
      "database_queries": "70-90% reduction",
      "page_load_times": "50-80% faster",
      "api_response": "88% cache hit rate",
      "cost_savings": "reduced server load"
    }
  },
  
  "database_patterns": {
    "connection_management": {
      "pool_size": "10 max connections",
      "queue_limit": "0 (unlimited queue)",
      "timeout": "20 seconds connection timeout",
      "retry_logic": "3 attempts with exponential backoff"
    },
    "query_patterns": {
      "correct_simple": "pool.execute() for non-transactional",
      "correct_transaction": "try { conn = getConnection() } finally { conn.release() }",
      "parallel_queries": "Promise.all() for independent operations",
      "batch_operations": "multi-statement with transaction"
    },
    "mysql2_specific": {
      "limit_offset": "use string interpolation with validated integers",
      "parameter_binding": "? for user input only",
      "safe_interpolation": ["validated integers", "predefined columns", "ORDER BY directions"],
      "never_interpolate": ["user strings", "table names", "column names from input"]
    },
    "optimization": {
      "query_optimizer": "EXPLAIN analysis built-in",
      "n_plus_one_detection": "automatic warning system",
      "index_hints": "USE INDEX for complex queries",
      "query_batching": "reduce round trips"
    }
  },
  
  "testing_infrastructure": {
    "test_categories": {
      "unit_tests": "component and function testing",
      "integration_tests": "API and database testing",
      "e2e_tests": "Playwright browser automation",
      "performance_tests": "K6 load testing",
      "security_tests": "penetration and vulnerability",
      "accessibility_tests": "WCAG compliance",
      "visual_regression": "screenshot comparison"
    },
    "test_coverage": {
      "target": ">90% code coverage",
      "critical_paths": "100% coverage required",
      "reporting": "automated coverage reports",
      "enforcement": "CI/CD pipeline checks"
    },
    "load_testing": {
      "tools": ["Playwright (browser)", "K6 (API)", "Artillery (scenarios)"],
      "targets": {
        "concurrent_users": "1000+",
        "response_time": "<1s API, <3s page",
        "error_rate": "<1%",
        "throughput": "1000 req/s"
      }
    },
    "regression_prevention": {
      "pricing_matrix": "comprehensive edge case tests",
      "features_tab": "UI interaction tests",
      "room_recommendations": "data validation tests",
      "connection_leaks": "resource monitoring tests"
    }
  },
  
  "security_measures": {
    "input_validation": {
      "schemas": "Zod comprehensive validation",
      "rate_limiting": "configurable windows per endpoint",
      "xss_prevention": "input sanitization all forms",
      "sql_injection": "parameterized queries only",
      "csrf_protection": "secure cookies + tokens"
    },
    "encryption": {
      "payment_credentials": "AES-256-GCM encryption",
      "passwords": "bcrypt with salt rounds 10",
      "sensitive_settings": "automatic encryption detection",
      "key_management": "PBKDF2 100000 iterations",
      "data_format": "base64(iv + auth_tag + data)"
    },
    "file_upload_security": {
      "allowed_types": ["JPEG", "PNG", "WebP", "PDF"],
      "scanning": "malicious content detection",
      "size_limits": "5MB images 10MB documents",
      "filename_generation": "secure random naming",
      "directory_protection": "traversal prevention",
      "storage": "outside web root"
    },
    "api_security": {
      "authentication": "JWT required all protected routes",
      "authorization": "role-based endpoint access",
      "rate_limiting": "per-user and per-IP",
      "audit_logging": "all admin actions tracked",
      "api_keys": "vendor-specific for integrations"
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
        "volume_pricing_discounts",
        "smart_home_compatibility_check",
        "professional_measurement_service"
      ]
    },
    "pricing_engine": {
      "calculation_flow": [
        "base_price_foundation",
        "dimensional_pricing_matrix",
        "fabric_material_surcharges",
        "configuration_modifiers",
        "customer_tier_pricing",
        "volume_quantity_breaks",
        "vendor_specific_discounts",
        "coupon_code_application",
        "tax_calculation_cached",
        "shipping_cost_rules"
      ],
      "discount_types": {
        "vendor_automatic": "percentage or fixed amount",
        "vendor_coupons": "code-based with limits",
        "volume_tiers": "quantity-based breaks",
        "customer_specific": "negotiated B2B rates",
        "seasonal": "time-based campaigns"
      }
    },
    "order_management": {
      "features": [
        "multi_vendor_order_splitting",
        "complex_pricing_calculations",
        "modification_after_placement",
        "partial_fulfillment_tracking",
        "installation_scheduling_integration",
        "commission_calculation_automatic",
        "return_rma_processing",
        "reorder_templates"
      ]
    },
    "vendor_system": {
      "architecture": "true multi-vendor marketplace",
      "features": [
        "independent_product_catalogs",
        "vendor_specific_pricing",
        "custom_discount_rules",
        "sales_team_management",
        "commission_tracking",
        "storefront_customization",
        "order_fulfillment_workflow",
        "financial_reporting"
      ]
    }
  },
  
  "api_consolidation_achievements": {
    "metrics": {
      "endpoint_reduction": "215 → 50 (77% reduction)",
      "response_time": "350ms → 115ms (67% faster)",
      "database_connections": "152 → 12 (92% reduction)",
      "code_reduction": "~25% of API codebase removed",
      "maintenance_burden": "significantly reduced"
    },
    "architectural_improvements": {
      "action_based_routing": "single endpoint multiple operations",
      "comprehensive_responses": "complete page data single call",
      "standardized_errors": "25+ specific error codes",
      "automatic_caching": "built into handlers",
      "role_verification": "automatic permission checking"
    },
    "removed_features": {
      "deprecated_apis": "165 files removed",
      "unused_components": "~20 AR/VR components",
      "empty_directories": "10+ cleaned up",
      "duplicate_code": "consolidated into services"
    }
  },
  
  "critical_fixes_summary": {
    "database_connection_policy_2025": {
      "strict_rule": "NEVER make direct database calls outside service layer",
      "allowed_locations": [
        "/lib/db/* - Database layer only",
        "/lib/services/* - Service layer only", 
        "/lib/api/v2/handlers/* - V2 handlers only"
      ],
      "forbidden": "Direct pool.execute() in pages, components, middleware",
      "correct_pattern": "Component → V2 API → Handler → Service → DB",
      "violations_fixed": [
        "/app/page.tsx - migrated to V2 content API",
        "/lib/auth.ts - migrated to V2 auth API",
        "/lib/settings.ts - migrated to V2 settings API"
      ]
    },
    "database_connection_leak": {
      "issue": "152/10 connections causing failures",
      "root_cause": "disabled cache + direct DB calls in components",
      "solution": "V2 API architecture + connection pooling",
      "impact": "92% reduction in connections"
    },
    "mysql_parameter_binding": {
      "issue": "LIMIT ? OFFSET ? failures",
      "solution": "safe interpolation for integers only",
      "pattern": "WHERE ? params, LIMIT ${validated}",
      "validation": "strict integer checking"
    },
    "checkout_optimization": {
      "cart_stage": "no tax calculation",
      "checkout_stage": "tax on ZIP entry only",
      "caching": "10 minute ZIP code cache",
      "race_condition": "fixed with state management"
    },
    "security_improvements": {
      "payment_encryption": "AES-256-GCM implemented",
      "cart_isolation": "fixed userId=1 issue",
      "role_validation": "all endpoints protected",
      "audit_logging": "comprehensive tracking"
    },
    "performance_optimization": {
      "lazy_loading": "dashboard components",
      "parallel_queries": "Promise.all patterns",
      "cache_warming": "scheduled jobs",
      "query_optimization": "EXPLAIN analysis"
    },
    "unified_product_page_ui_fixes": {
      "issue": "Pricing and Fabric tabs had UI layout problems",
      "date_fixed": "2025-06-29",
      "pricing_tab_fixes": {
        "problem": "Table cells were too large and compacted",
        "solution": "Reduced cell heights and converted to text inputs",
        "changes": {
          "cell_height": "h-10 → h-8",
          "cell_width": "min-w-[80px] → min-w-[60px]",
          "input_type": "TableCell → Input with type='text' pattern='[0-9]*\\.?[0-9]{0,2}'",
          "input_size": "Added size='sm' className='h-6'",
          "visual_result": "More compact, better spacing, decimal validation"
        }
      },
      "fabric_tab_fixes": {
        "problem": "Content didn't fit properly in the container",
        "solution": "Added scrollable container with proper height constraints",
        "changes": {
          "container_classes": "Added 'overflow-y-auto max-h-[600px]'",
          "scroll_behavior": "Vertical scroll for overflow content",
          "responsive_height": "Container adapts to viewport with max height limit"
        }
      },
      "files_modified": [
        "/app/vendor/products/components/tabs/PricingTab.tsx",
        "/app/vendor/products/components/tabs/FabricTab.tsx"
      ]
    }
  },
  
  "development_guidelines": {
    "file_creation_rules": {
      "NEVER": "create files unless absolutely necessary",
      "ALWAYS": "prefer editing existing files",
      "NO_DOCS": "never create .md files unless requested",
      "USE_V2": "extend V2 handlers for new APIs"
    },
    "testing_requirements": {
      "mandatory": "test all code paths",
      "ui_verification": "physically navigate and verify",
      "data_flow": "database to UI complete testing",
      "edge_cases": "comprehensive error handling"
    },
    "code_patterns": {
      "services": "business logic in service classes",
      "handlers": "thin controllers delegate to services",
      "validation": "Zod schemas for all inputs",
      "errors": "standardized error responses"
    },
    "performance_standards": {
      "api_response": "<1 second target",
      "page_load": "<3 seconds target",
      "database_queries": "minimize N+1 problems",
      "caching": "implement at all levels"
    }
  },
  
  "monitoring_and_operations": {
    "health_checks": {
      "database": "connection pool monitoring",
      "cache": "hit rate tracking",
      "api": "response time alerts",
      "errors": "rate monitoring"
    },
    "performance_metrics": {
      "apm": "OpenTelemetry integration",
      "custom_metrics": "business KPIs",
      "alerts": "PagerDuty integration",
      "dashboards": "Grafana visualization"
    },
    "deployment": {
      "strategy": "blue-green deployment",
      "rollback": "automatic on errors",
      "migration": "zero-downtime database",
      "scaling": "horizontal pod autoscaling"
    }
  },
  
  "future_roadmap": {
    "planned_features": [
      "GraphQL API layer",
      "Microservices migration",
      "Real-time collaboration",
      "Advanced AI recommendations",
      "Mobile applications"
    ],
    "technical_debt": [
      "Complete Prisma migration",
      "Remove legacy jQuery code",
      "Upgrade to React 19",
      "Implement WebAssembly for 3D"
    ]
  },
  
  "critical_sql_best_practices": {
    "overview": "Recurring SQL errors have been identified as a major issue",
    "common_mistakes": {
      "reserved_keywords": {
        "problem": "Using MySQL reserved keywords as aliases or identifiers",
        "examples": ["of", "order", "group", "select", "where", "from", "as"],
        "solution": "Always use safe aliases like 'ful' instead of 'of', 'ord' instead of 'order'",
        "prevention": "Check MySQL reserved keywords list before naming"
      },
      "column_existence": {
        "problem": "Assuming columns exist without checking database schema",
        "examples": ["phone_country", "shipping_address", "vo.total_amount"],
        "solution": "ALWAYS check table structure with DESCRIBE command first",
        "prevention": "Run 'DESCRIBE table_name' before writing any SQL query"
      },
      "table_aliases": {
        "problem": "Using undefined table aliases in queries",
        "examples": ["vo.vendor_id when 'vo' alias doesn't exist"],
        "solution": "Ensure all aliases are defined in FROM/JOIN clauses",
        "prevention": "Double-check all table aliases match their declarations"
      },
      "data_type_assumptions": {
        "problem": "Assuming data types without verification",
        "examples": ["treating decimals as strings", "wrong date formats"],
        "solution": "Check column types with DESCRIBE before operations",
        "prevention": "Always verify data types match expected format"
      }
    },
    "mandatory_verification_steps": [
      "ALWAYS run 'DESCRIBE table_name' before writing queries",
      "ALWAYS check if columns exist before referencing them",
      "ALWAYS verify table relationships and foreign keys",
      "ALWAYS test SQL queries in small pieces first",
      "NEVER assume column names based on convention",
      "NEVER use reserved keywords as aliases"
    ],
    "query_writing_checklist": {
      "step_1": "Identify all tables needed for the query",
      "step_2": "Run DESCRIBE on each table to verify structure",
      "step_3": "Check for reserved keywords in aliases",
      "step_4": "Verify all column names exist exactly as spelled",
      "step_5": "Test JOIN conditions with simple SELECT first",
      "step_6": "Build complex queries incrementally",
      "step_7": "Always use parameterized queries for user input"
    },
    "database_interaction_rules": {
      "connection_verification": "Always check database connection before queries",
      "error_handling": "Catch and log SQL errors with full context",
      "transaction_usage": "Use transactions for multi-step operations",
      "connection_pooling": "Always release connections after use",
      "query_logging": "Log queries in development for debugging"
    }
  },
  
  "api_response_format_standards": {
    "overview": "Consistent API response formats prevent frontend errors",
    "required_structure": {
      "success_response": {
        "success": true,
        "data": "actual response data",
        "metadata": "optional pagination, counts, etc"
      },
      "error_response": {
        "success": false,
        "error": "error message",
        "code": "specific error code",
        "details": "optional additional context"
      }
    },
    "common_frontend_expectations": {
      "array_responses": "Always return arrays for list endpoints, even if empty",
      "object_responses": "Always return objects for detail endpoints, null if not found",
      "numeric_values": "Always parse decimals/floats, never return as strings",
      "date_formats": "Always use ISO 8601 format for dates",
      "null_handling": "Use null for missing values, not undefined or empty strings"
    },
    "infinite_loop_prevention": {
      "error_handling": "Never let errors trigger re-renders that cause new requests",
      "loading_states": "Always set loading to false on both success and error",
      "dependency_arrays": "Be careful with useEffect dependencies",
      "error_boundaries": "Implement error boundaries to catch render errors",
      "request_deduplication": "Prevent duplicate requests with request IDs"
    }
  },
  
  "service_method_patterns": {
    "executeParallel_usage": {
      "returns": "Object with query keys, NOT an array",
      "correct_usage": "const results = await executeParallel(); const { key1, key2 } = results;",
      "incorrect_usage": "const [result1, result2] = await executeParallel(); // WRONG!",
      "type_safety": "Always type the generic parameter properly"
    },
    "transaction_pattern": {
      "structure": "try { begin; operations; commit; } catch { rollback; } finally { release; }",
      "connection_handling": "Always get connection from pool, never use pool directly in transactions",
      "error_propagation": "Re-throw errors after rollback for proper error handling"
    }
  },
  
  "debugging_workflow": {
    "sql_errors": [
      "1. Copy the exact error message",
      "2. Extract the table names from the query",
      "3. Run DESCRIBE on each table",
      "4. Compare column names in error with actual schema",
      "5. Check for typos and reserved keywords",
      "6. Test simplified version of query first"
    ],
    "api_errors": [
      "1. Check browser network tab for actual response",
      "2. Verify response format matches frontend expectations",
      "3. Check for missing await keywords",
      "4. Verify error handling doesn't trigger re-renders",
      "5. Add console.logs at key points",
      "6. Check for race conditions"
    ]
  },
  
  "important_reminders": {
    "do_what_asked": "nothing more, nothing less",
    "never_create_files": "unless absolutely necessary",
    "always_edit_existing": "prefer modifying over creating",
    "no_proactive_docs": "never create documentation unless requested",
    "follow_v2_pattern": "use consolidated API architecture",
    "test_everything": "verify UI and data flow completely",
    "check_claude_md": "this is the single source of truth",
    "verify_sql_first": "ALWAYS check database schema before writing SQL",
    "no_assumptions": "NEVER assume column names or data types"
  }
}