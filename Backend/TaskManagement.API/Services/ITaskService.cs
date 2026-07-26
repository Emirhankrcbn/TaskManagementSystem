// görevlerin oluşturma, okuma, güncelleme, silme işlemlerini gerçekleştiren servis arayüzü

using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface ITaskService
    {
        Task<PagedResultDto<TaskResponseDto>> GetAllTasksByUserIdAsync(Guid userId, TaskFilterDto filter); // listeleme metodunun imzası
        Task<TaskResponseDto> GetTaskByIdAsync(Guid taskId, Guid userId);
        Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto taskCreateDto, Guid userId);
        Task<TaskResponseDto> UpdateTaskAsync(Guid taskId, Guid userId, TaskUpdateDto taskUpdateDto);
        Task<bool> DeleteTaskAsync(Guid taskId, Guid userId);
        Task<TaskAttachmentResponseDto> UploadAttachmentAsync(Guid taskId, Guid userId, IFormFile file);
        Task<List<TaskAttachmentResponseDto>> GetTaskAttachmentsAsync(Guid taskId, Guid userId);
        Task<bool> DeleteAttachmentAsync(Guid taskId, Guid attachmentId, Guid userId);
        Task<TaskCommentResponseDto> AddCommentAsync(Guid taskId, Guid userId, TaskCommentCreateDto commentDto); // yorum ekleme metodunun imzası
        Task<List<TaskCommentResponseDto>> GetTaskCommentsAsync(Guid taskId, Guid userId); // yorumları listeleme (okuma) metodunun imzası
        Task<TaskCommentResponseDto> UpdateCommentAsync(Guid taskId, Guid commentId, Guid userId, TaskCommentUpdateDto commentDto);
        Task<bool> DeleteCommentAsync(Guid taskId, Guid commentId, Guid userId);
        Task<TaskStatisticsDto> GetTaskStatisticsAsync(Guid userId);
        Task<List<TaskResponseDto>> GetOverdueTasksAsync(Guid userId);
        Task<SubTaskResponseDto> AddSubTaskAsync(Guid taskId, Guid userId, SubTaskCreateDto dto);
        Task<SubTaskResponseDto> UpdateSubTaskAsync(Guid taskId, Guid subTaskId, Guid userId, SubTaskUpdateDto dto);
        Task<bool> DeleteSubTaskAsync(Guid taskId, Guid subTaskId, Guid userId);
    }
}