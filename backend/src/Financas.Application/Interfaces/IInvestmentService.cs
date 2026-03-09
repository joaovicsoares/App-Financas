using Financas.Application.DTOs;

namespace Financas.Application.Interfaces;

public interface IInvestmentService
{
    Task<IEnumerable<InvestmentResponseDto>> GetAllAsync(Guid userId);
    Task<InvestmentSummaryDto> GetSummaryAsync(Guid userId);
    Task<InvestmentResponseDto> CreateAsync(Guid userId, CreateInvestmentDto dto);
    Task<InvestmentResponseDto> UpdateAsync(Guid userId, Guid id, UpdateInvestmentDto dto);
    Task<InvestmentResponseDto> RedeemAsync(Guid userId, Guid id, RedeemInvestmentDto dto);
    Task DeleteAsync(Guid userId, Guid id);
}
