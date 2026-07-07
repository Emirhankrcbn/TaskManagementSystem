// görevlerin oluşturma, okuma, güncelleme, silme işlemlerini gerçekleştiren servis arayüzü

using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskResponseDto>> GetAllTasksByUserIdAsync(Guid userId);
        Task<TaskResponseDto> GetTaskByIdAsync(Guid taskId, Guid userId);
        Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto taskCreateDto);
        Task<TaskResponseDto> UpdateTaskAsync(Guid taskId, Guid userId, TaskUpdateDto taskUpdateDto);
        Task<bool> DeleteTaskAsync(Guid taskId, Guid userId);
    }
}