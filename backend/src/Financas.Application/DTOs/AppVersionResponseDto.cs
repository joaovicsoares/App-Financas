namespace Financas.Application.DTOs;

public class AppVersionResponseDto
{
    public string LatestVersion { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
}
