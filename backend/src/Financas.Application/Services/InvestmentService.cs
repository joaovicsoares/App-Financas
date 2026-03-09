using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Entities;
using Financas.Domain.Enums;
using Financas.Domain.Interfaces;

namespace Financas.Application.Services;

public class InvestmentService : IInvestmentService
{
    private readonly IInvestmentRepository _investmentRepository;

    public InvestmentService(IInvestmentRepository investmentRepository)
    {
        _investmentRepository = investmentRepository;
    }

    public async Task<IEnumerable<InvestmentResponseDto>> GetAllAsync(Guid userId)
    {
        var investments = await _investmentRepository.GetByUserIdAsync(userId);
        return investments.Select(MapToDto);
    }

    public async Task<InvestmentSummaryDto> GetSummaryAsync(Guid userId)
    {
        var investments = await _investmentRepository.GetByUserIdAsync(userId);
        var active = investments.Where(i => i.Status == InvestmentStatus.Active).ToList();

        var totalInvested = active.Sum(i => i.AmountInvested);
        var totalCurrentValue = active.Sum(i => CalculateCurrentValue(i));
        var totalYield = totalCurrentValue - totalInvested;

        return new InvestmentSummaryDto
        {
            TotalInvested = totalInvested,
            TotalCurrentValue = totalCurrentValue,
            TotalYield = totalYield,
            YieldPercentage = totalInvested > 0 ? Math.Round(totalYield / totalInvested * 100, 2) : 0,
            ActiveCount = active.Count
        };
    }

    public async Task<InvestmentResponseDto> CreateAsync(Guid userId, CreateInvestmentDto dto)
    {
        var investment = new Investment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = dto.Name,
            Type = dto.Type,
            Status = InvestmentStatus.Active,
            AmountInvested = dto.AmountInvested,
            AnnualRate = dto.AnnualRate,
            StartDate = dto.StartDate,
            MaturityDate = dto.MaturityDate,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _investmentRepository.CreateAsync(investment);
        return MapToDto(investment);
    }

    public async Task<InvestmentResponseDto> UpdateAsync(Guid userId, Guid id, UpdateInvestmentDto dto)
    {
        var investment = await _investmentRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Investimento não encontrado.");

        if (investment.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão para editar este investimento.");

        if (investment.Status == InvestmentStatus.Redeemed)
            throw new InvalidOperationException("Não é possível editar um investimento já resgatado.");

        investment.Name = dto.Name;
        investment.AmountInvested = dto.AmountInvested;
        investment.AnnualRate = dto.AnnualRate;
        investment.MaturityDate = dto.MaturityDate;
        investment.Notes = dto.Notes;

        await _investmentRepository.UpdateAsync(investment);
        return MapToDto(investment);
    }

    public async Task<InvestmentResponseDto> RedeemAsync(Guid userId, Guid id, RedeemInvestmentDto dto)
    {
        var investment = await _investmentRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Investimento não encontrado.");

        if (investment.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão para resgatar este investimento.");

        if (investment.Status == InvestmentStatus.Redeemed)
            throw new InvalidOperationException("Investimento já foi resgatado.");

        investment.Status = InvestmentStatus.Redeemed;
        investment.RedeemedAt = DateTime.UtcNow;
        investment.RedeemedAmount = dto.RedeemedAmount;

        await _investmentRepository.UpdateAsync(investment);
        return MapToDto(investment);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var investment = await _investmentRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Investimento não encontrado.");

        if (investment.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão para excluir este investimento.");

        await _investmentRepository.DeleteAsync(id);
    }

    private static decimal CalculateCurrentValue(Investment investment)
    {
        if (investment.Status == InvestmentStatus.Redeemed)
            return investment.RedeemedAmount ?? investment.AmountInvested;

        var days = (DateTime.UtcNow - investment.StartDate).TotalDays;
        if (days <= 0) return investment.AmountInvested;

        // Compound interest: V = P × (1 + r)^(t/365)
        var currentValue = investment.AmountInvested *
            (decimal)Math.Pow((double)(1 + investment.AnnualRate), days / 365.0);

        return Math.Round(currentValue, 2);
    }

    private static InvestmentResponseDto MapToDto(Investment investment)
    {
        var currentValue = CalculateCurrentValue(investment);
        var totalYield = currentValue - investment.AmountInvested;

        return new InvestmentResponseDto
        {
            Id = investment.Id,
            Name = investment.Name,
            Type = investment.Type,
            Status = investment.Status,
            AmountInvested = investment.AmountInvested,
            AnnualRate = investment.AnnualRate,
            StartDate = investment.StartDate,
            MaturityDate = investment.MaturityDate,
            RedeemedAt = investment.RedeemedAt,
            RedeemedAmount = investment.RedeemedAmount,
            Notes = investment.Notes,
            CreatedAt = investment.CreatedAt,
            CurrentValue = currentValue,
            TotalYield = totalYield,
            YieldPercentage = investment.AmountInvested > 0
                ? Math.Round(totalYield / investment.AmountInvested * 100, 2)
                : 0
        };
    }
}
