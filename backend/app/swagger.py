"""Flasgger (OpenAPI/Swagger) configuration for VTaxon API."""

SWAGGER_TEMPLATE = {
    "info": {
        "title": "VTaxon API",
        "description": "VTuber 生物分類系統 API",
        "version": "1.0.0",
    },
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Supabase JWT: `Bearer <token>`",
        },
    },
    "tags": [
        {"name": "Health", "description": "健康檢查"},
        {"name": "Auth", "description": "認證與 OAuth callback"},
        {"name": "Users", "description": "使用者個人資料"},
        {"name": "Directory", "description": "使用者名錄與探索"},
        {"name": "OAuth", "description": "OAuth 帳號管理"},
        {"name": "Species", "description": "物種搜尋與查詢 (GBIF)"},
        {"name": "Taxonomy", "description": "分類樹資料"},
        {"name": "Traits", "description": "角色物種特徵"},
        {"name": "Breeds", "description": "品種管理"},
        {"name": "Fictional", "description": "虛構物種"},
        {"name": "Reports", "description": "檢舉與黑名單"},
        {"name": "Notifications", "description": "通知"},
        {"name": "Admin", "description": "管理員端點"},
        {"name": "Livestream", "description": "直播狀態"},
        {"name": "Subscriptions", "description": "直播訂閱管理"},
        {"name": "Webhooks", "description": "Twitch/YouTube webhook"},
        {"name": "SEO", "description": "SEO sitemap"},
        {"name": "SSR", "description": "伺服器端渲染"},
    ],
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        },
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/",
}
