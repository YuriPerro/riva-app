use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct StoredApiKey {
    api_key: String,
}

#[derive(Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

fn openai_key_path() -> Result<std::path::PathBuf, String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    let dir = std::path::PathBuf::from(home).join(".forge");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("openai.json"))
}

pub fn save_api_key(key: &str) -> Result<(), String> {
    let path = openai_key_path()?;
    let stored = StoredApiKey {
        api_key: key.to_string(),
    };
    let json = serde_json::to_string(&stored).map_err(|e| e.to_string())?;
    std::fs::write(&path, &json).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn load_api_key() -> Result<Option<String>, String> {
    let path = openai_key_path()?;
    if !path.exists() {
        return Ok(None);
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let stored: StoredApiKey = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(stored.api_key))
}

pub fn clear_api_key() -> Result<(), String> {
    let path = openai_key_path()?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub async fn generate_standup(api_key: &str, prompt: &str) -> Result<String, String> {
    let client = reqwest::Client::new();

    let system_message = "You are a standup summary writer. Convert the structured work data below into a concise, professional daily standup update. Use first person. Keep it brief — 3-5 bullet points max. Group related items. Do not add information that isn't in the data.";

    let request = ChatRequest {
        model: "gpt-4o-mini".to_string(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_message.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: prompt.to_string(),
            },
        ],
        max_tokens: 500,
        temperature: 0.3,
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to call OpenAI: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(match status.as_u16() {
            401 => "Invalid API key. Please check your OpenAI API key in Settings.".to_string(),
            429 => "Rate limit exceeded. Please try again in a moment.".to_string(),
            _ => format!("OpenAI API error ({}): {}", status, body),
        });
    }

    let chat_response: ChatResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    chat_response
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .ok_or_else(|| "No response from OpenAI".to_string())
}
