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

    pub fn from_str(s: &str) -> Self {
        match s {
            "Allow" => PermissionsResponse::Allow,
            "Deny" => PermissionsResponse::Deny,
            "AllowAll" => PermissionsResponse::AllowAll,
            _ => panic!("Invalid permissions response: {}", s),
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
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for PermissionsResponse {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(Self::from_str(&s))
    }
}

pub struct AppHandleState {
    pub app_handle: AppHandle,
}
