// SQL tablolarinda istenen ON DELETE CASCADE ve ON DELETE SET NULL kurallari

using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Models;

namespace TaskManagement.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<TaskAttachment> TaskAttachments { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // user tablosu konfigürasyonları
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();
            });

            // category tablosu konfigürasyonları (ON DELETE CASCADE)
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasOne(c => c.User)
                      .WithMany(u => u.Categories)
                      .HasForeignKey(c => c.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // tasks tablosu konfigürasyonları (ON DELETE CASCADE ve ON DELETE SET NULL)
            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.HasOne(t => t.User)
                      .WithMany(u => u.Tasks)
                      .HasForeignKey(t => t.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(t => t.Category)
                      .WithMany(c => c.Tasks)
                      .HasForeignKey(t => t.CategoryId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // TaskAttachments tablosu konfigürasyonları
            modelBuilder.Entity<TaskAttachment>(entity =>
            {
                entity.HasOne(ta => ta.Task)
                      .WithMany(t => t.Attachments)
                      .HasForeignKey(ta => ta.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // TaskComments tablosu konfigürasyonları
            modelBuilder.Entity<TaskComment>(entity =>
            {
                entity.HasOne(tc => tc.Task)
                      .WithMany(t => t.Comments)
                      .HasForeignKey(tc => tc.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(tc => tc.User)
                      .WithMany(u => u.Comments)
                      .HasForeignKey(tc => tc.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}