// Create, Read, Update, Delete işlemleri

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Authorize] // Güvenlik kalkanı: Token zorunlu!
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private Guid GetUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userIdStr!);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTasks([FromQuery] TaskFilterDto filter)
        {
            var result = await _taskService.GetAllTasksByUserIdAsync(GetUserId(), filter);
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetTaskById(Guid id)
        {
            try
            {
                var task = await _taskService.GetTaskByIdAsync(id, GetUserId());
                return Ok(task);
            }
            catch (Exception ex)
            {
                return NotFound(new { error = ex.Message }); // 404 Bulunamadı
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskCreateDto taskCreateDto)
        {
            var result = await _taskService.CreateTaskAsync(taskCreateDto, GetUserId());
            return CreatedAtAction(nameof(GetTaskById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(Guid id, [FromBody] TaskUpdateDto taskUpdateDto)
        {
            try
            {
                var updatedTask = await _taskService.UpdateTaskAsync(id, GetUserId(), taskUpdateDto);
                return Ok(updatedTask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(Guid id)
        {
            try
            {
                await _taskService.DeleteTaskAsync(id, GetUserId());
                return NoContent(); // 204 No Content: Başarıyla silindi, dönecek veri yok
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Dosya yükleme için yeni bir endpointi
        [HttpPost("{taskId}/attachments")]
        [Consumes("multipart/form-data")] // Sadece dosya yükleme isteklerini kabul et
        [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadAttachment(Guid taskId, [FromForm] TaskAttachmentUploadDto uploadDto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _taskService.UploadAttachmentAsync(taskId, userId, uploadDto.File);
                return StatusCode(201, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Göreve ait dosyaları listeleme
        [HttpGet("{taskId}/attachments")]
        public async Task<IActionResult> GetTaskAttachments(Guid taskId)
        {
            try
            {
                var result = await _taskService.GetTaskAttachmentsAsync(taskId, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        // Görevden dosya silme
        [HttpDelete("{taskId}/attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(Guid taskId, Guid attachmentId)
        {
            try
            {
                await _taskService.DeleteAttachmentAsync(taskId, attachmentId, GetUserId());
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Göreve yeni yorum ekleme
        [HttpPost("{taskId}/comments")]
        public async Task<IActionResult> AddComment(Guid taskId, [FromBody] TaskCommentCreateDto commentDto)
        {
            try
            {
                var result = await _taskService.AddCommentAsync(taskId, GetUserId(), commentDto);
                return StatusCode(201, result); // 201 Created döner
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Görevin yorumlarını listeleme
        [HttpGet("{taskId}/comments")]
        public async Task<IActionResult> GetTaskComments(Guid taskId)
        {
            try
            {
                var result = await _taskService.GetTaskCommentsAsync(taskId, GetUserId());
                return Ok(result); // 200 OK ile listeyi döner
            }
            catch (Exception ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        // Yorumu güncelleme (düzenleme)
        [HttpPut("{taskId}/comments/{commentId}")]
        public async Task<IActionResult> UpdateComment(Guid taskId, Guid commentId, [FromBody] TaskCommentUpdateDto commentDto)
        {
            try
            {
                var result = await _taskService.UpdateCommentAsync(taskId, commentId, GetUserId(), commentDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Yorum silme
        [HttpDelete("{taskId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid taskId, Guid commentId)
        {
            try
            {
                await _taskService.DeleteCommentAsync(taskId, commentId, GetUserId());
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetTaskStatistics()
        {
            var result = await _taskService.GetTaskStatisticsAsync(GetUserId());
            return Ok(result);
        }

        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueTasks()
        {
            var result = await _taskService.GetOverdueTasksAsync(GetUserId());
            return Ok(result);
        }

        // Göreve yeni alt görev (checklist maddesi) ekleme
        [HttpPost("{taskId}/subtasks")]
        public async Task<IActionResult> AddSubTask(Guid taskId, [FromBody] SubTaskCreateDto dto)
        {
            try
            {
                var result = await _taskService.AddSubTaskAsync(taskId, GetUserId(), dto);
                return StatusCode(201, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Alt görevi güncelleme (başlık değiştirme veya tamamlandı/tamamlanmadı işaretleme)
        [HttpPut("{taskId}/subtasks/{subTaskId}")]
        public async Task<IActionResult> UpdateSubTask(Guid taskId, Guid subTaskId, [FromBody] SubTaskUpdateDto dto)
        {
            try
            {
                var result = await _taskService.UpdateSubTaskAsync(taskId, subTaskId, GetUserId(), dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Alt görev silme
        [HttpDelete("{taskId}/subtasks/{subTaskId}")]
        public async Task<IActionResult> DeleteSubTask(Guid taskId, Guid subTaskId)
        {
            try
            {
                await _taskService.DeleteSubTaskAsync(taskId, subTaskId, GetUserId());
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}