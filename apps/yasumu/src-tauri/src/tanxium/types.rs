use deno_runtime::deno_permissions::prompter::PromptResponse;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionPrompt {
    pub message: String,
    pub name: String,
    pub api_name: Option<String>,
    pub is_unary: bool,
    pub response: Option<PermissionsResponse>,
    pub stack: Vec<String>,
}

#[derive(Debug, Clone)]
pub enum PermissionsResponse {
    Allow,
    Deny,
    AllowAll,
}

impl PermissionsResponse {
    pub fn as_str(&self) -> &str {
        match self {
            PermissionsResponse::Allow => "Allow",
            PermissionsResponse::Deny => "Deny",
            PermissionsResponse::AllowAll => "AllowAll",
        }
    }

    pub fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "Allow" => Ok(PermissionsResponse::Allow),
            "Deny" => Ok(PermissionsResponse::Deny),
            "AllowAll" => Ok(PermissionsResponse::AllowAll),
            other => Err(format!("unknown permission response: {other}")),
        }
    }

    pub fn to_prompt_response(&self) -> PromptResponse {
        match self {
            PermissionsResponse::Allow => PromptResponse::Allow,
            PermissionsResponse::Deny => PromptResponse::Deny,
            PermissionsResponse::AllowAll => PromptResponse::AllowAll,
        }
    }
}

impl Serialize for PermissionsResponse {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for PermissionsResponse {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let s = String::deserialize(deserializer)?;
        Self::from_str(&s).map_err(serde::de::Error::custom)
    }
}

pub struct AppHandleState {
    pub app_handle: AppHandle,
}
