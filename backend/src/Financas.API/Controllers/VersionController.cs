using Financas.Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Financas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VersionController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public VersionController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("check")]
    public ActionResult<AppVersionResponseDto> Check()
    {
        var latestVersion = _configuration["AppConfig:LatestVersion"];
        var downloadUrl = _configuration["AppConfig:DownloadUrl"];

        return Ok(new AppVersionResponseDto
        {
            LatestVersion = latestVersion ?? "1.0.0",
            DownloadUrl = downloadUrl ?? ""
        });
    }
}
